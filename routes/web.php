<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShipmentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Root: redirect ke login ──────────────────────────────────────────────
Route::get('/', fn () => redirect()->route('login'));

// ─── Dashboard (data real) ───────────────────────────────────────
Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// ─── Monitoring Resi ─────────────────────────────────────────────────────
Route::middleware('auth')->prefix('resi')->name('resi.')->group(function () {
    Route::get('/',              [ShipmentController::class, 'index'])      ->name('index');
    Route::get('/export',        [ShipmentController::class, 'export'])     ->name('export');
    Route::get('/show/{shipment}', [ShipmentController::class, 'show'])     ->name('show');
    Route::get('/import',        [ShipmentController::class, 'importView']) ->name('import');
    Route::post('/import',       [ShipmentController::class, 'import'])     ->name('import.store');
    Route::delete('/batch',      [ShipmentController::class, 'deleteBatch'])->name('batch.delete');
});

// ─── Laporan ──────────────────────────────────────────────────────────────
Route::middleware('auth')->get('/laporan', function () {
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

// ─── Profile ──────────────────────────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/profile',    [ProfileController::class, 'edit'])   ->name('profile.edit');
    Route::patch('/profile',  [ProfileController::class, 'update']) ->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
