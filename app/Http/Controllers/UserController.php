<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = $request->query('role');

        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'created_at'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when(in_array($role, [User::ROLE_ADMIN, User::ROLE_USER], true), function ($query) use ($role) {
                $query->where('role', $role);
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => in_array($role, [User::ROLE_ADMIN, User::ROLE_USER], true) ? $role : '',
            ],
            'roleCounts' => [
                'admin' => User::where('role', User::ROLE_ADMIN)->count(),
                'user' => User::where('role', User::ROLE_USER)->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_USER])],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->password = $validated['password'];
        $user->save();

        return to_route('users.index')->with('success', 'Akun pengguna berhasil dibuat.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_USER])],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        if ($user->is(auth()->user()) && $validated['role'] !== User::ROLE_ADMIN) {
            throw ValidationException::withMessages([
                'role' => 'Anda tidak dapat mengubah role akun Admin yang sedang digunakan.',
            ]);
        }

        DB::transaction(function () use ($user, $validated) {
            if ($user->role === User::ROLE_ADMIN && $validated['role'] !== User::ROLE_ADMIN) {
                $adminIds = User::query()
                    ->where('role', User::ROLE_ADMIN)
                    ->lockForUpdate()
                    ->pluck('id');

                if ($adminIds->count() <= 1) {
                    throw ValidationException::withMessages([
                        'role' => 'Role Admin tidak dapat diubah karena harus ada minimal satu Admin.',
                    ]);
                }
            }

            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->role = $validated['role'];

            if (!empty($validated['password'])) {
                $user->password = $validated['password'];
            }

            $user->save();
        });

        return to_route('users.index')->with('success', 'Data pengguna berhasil diperbarui.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->is(auth()->user())) {
            throw ValidationException::withMessages([
                'user' => 'Akun yang sedang digunakan tidak dapat dihapus.',
            ]);
        }

        DB::transaction(function () use ($user) {
            if ($user->role === User::ROLE_ADMIN) {
                $adminIds = User::query()
                    ->where('role', User::ROLE_ADMIN)
                    ->lockForUpdate()
                    ->pluck('id');

                if ($adminIds->count() <= 1) {
                    throw ValidationException::withMessages([
                        'user' => 'Admin terakhir tidak dapat dihapus.',
                    ]);
                }
            }

            $user->delete();
        });

        return to_route('users.index')->with('success', 'Akun pengguna berhasil dihapus.');
    }
}
