<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Root: redirect ke login 
Route::get('/', fn () => redirect()->route('login'));

// Dashboard dapat diakses oleh Admin dan User.
Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified', 'role:admin,user'])
    ->name('dashboard');

// Monitoring dan export dapat diakses oleh Admin dan User.
Route::middleware('auth')->prefix('resi')->name('resi.')->group(function () {
    Route::middleware('role:admin,user')->group(function () {
        Route::get('/', [ShipmentController::class, 'index'])->name('index');
        Route::get('/export', [ShipmentController::class, 'export'])->name('export');
        Route::get('/show/{shipment}', [ShipmentController::class, 'show'])->name('show');
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/import', [ShipmentController::class, 'importView'])->name('import');
        Route::post('/import', [ShipmentController::class, 'import'])->name('import.store');
        Route::post('/import/{token}/chunk', [ShipmentController::class, 'importChunk'])
            ->whereUuid('token')
            ->name('import.chunk');
        Route::delete('/import/{token}', [ShipmentController::class, 'cancelImport'])
            ->whereUuid('token')
            ->name('import.cancel');
        Route::delete('/batch', [ShipmentController::class, 'deleteBatch'])->name('batch.delete');
        Route::patch('/{shipment}/action', [ShipmentController::class, 'updateAction'])->name('action');
    });
});

// Master Daerah hanya dapat dikelola Admin.
Route::middleware(['auth', 'role:admin'])->prefix('destinations')->name('destinations.')->group(function () {
    Route::get('/',              [DestinationController::class, 'index'])  ->name('index');
    Route::post('/',             [DestinationController::class, 'store'])  ->name('store');
    Route::put('/{destination}', [DestinationController::class, 'update']) ->name('update');
    Route::delete('/{destination}', [DestinationController::class, 'destroy'])->name('destroy');
    Route::post('/import',       [DestinationController::class, 'import'])->name('import');
});

// Manajemen akun hanya dapat diakses Admin.
Route::middleware(['auth', 'role:admin'])->prefix('users')->name('users.')->group(function () {
    Route::get('/', [UserController::class, 'index'])->name('index');
    Route::post('/', [UserController::class, 'store'])->name('store');
    Route::put('/{user}', [UserController::class, 'update'])->name('update');
    Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
});

// Laporan hanya dapat diakses Admin pada tahap pembatasan role ini.
Route::middleware(['auth', 'role:admin'])->get('/laporan', function () {
    $summary         = \App\Models\Shipment::summary();
    $statusDist      = \App\Models\Shipment::statusDistribution();
    $topDestinations = \App\Models\Shipment::topDestinations(10);
    $dailyTrend      = \App\Models\Shipment::dailyTrend(30);

    return Inertia::render('Laporan', compact(
        'summary',
        'statusDist',
        'topDestinations',
        'dailyTrend',
    ));
})->name('laporan');

// Profil pribadi dapat dikelola Admin dan User.
Route::middleware(['auth', 'role:admin,user'])->group(function () {
    Route::get('/profile',    [ProfileController::class, 'edit'])   ->name('profile.edit');
    Route::patch('/profile',  [ProfileController::class, 'update']) ->name('profile.update');
});

// Penghapusan akun tetap dibatasi untuk Admin.
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
