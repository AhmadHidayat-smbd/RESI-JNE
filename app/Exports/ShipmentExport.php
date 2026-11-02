<?php

namespace App\Exports;

use App\Models\Shipment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ShipmentExport implements
    FromQuery,
    WithHeadings,
    WithMapping,
    ShouldAutoSize,
    WithStyles,
    WithColumnFormatting,
    WithTitle
{
    private Builder $query;
    private int $rowNumber = 0;
    private ?string $statusTitle;

    public function __construct(Builder $query, ?string $statusTitle = null)
    {
        $this->query = $query;
        $this->statusTitle = $statusTitle;
    }

    public function query(): Builder
    {
        return $this->query;
    }

    public function title(): string
    {
        return $this->statusTitle ? "Resi {$this->statusTitle}" : 'Monitoring Resi';
    }

    /**
     * Urutan kolom heading sesuai dengan file import asli:
     * No, POD, AWB, Keterangan, Tgl Jam Entry, Consignee Name, Adr1, Adr2, Adr3,
     * Origin Code, Destination Code, Detination Name, Service, Weight, Amount,
     * Coding, Status, Tgl Received, Receiver Reason, Latlong, POD Picture,
     * POD Signature, Foto POD 1-7, Success, Failed, On Delivery, On Process, Runsheet No
     */
    public function headings(): array
    {
        return [
            'No',              // A
            'POD',             // B
            'AWB',             // C
            'Keterangan',      // D
            'Tgl Jam Entry',   // E
            'Consignee Name',  // F
            'Adr1',            // G
            'Adr2',            // H
            'Adr3',            // I
            'Origin Code',     // J
            'Destination Code',// K
            'Detination Name', // L  (sesuai ejaan file asli)
            'Service',         // M
            'Weight',          // N
            'Amount',          // O
            'Coding',          // P
            'Status',          // Q
            'Tgl Received',    // R
            'Receiver Reason', // S
            'Latlong',         // T
            'POD Picture',     // U
            'POD Signature',   // V
            'Foto POD 1',      // W
            'Foto POD 2',      // X
            'Foto POD 3',      // Y
            'Foto POD 4',      // Z
            'Foto POD 5',      // AA
            'Foto POD 6',      // AB
            'Foto POD 7',      // AC
            'Success',         // AD
            'Failed',          // AE
            'On Delivery',     // AF
            'On Process',      // AG
            'Runsheet No',     // AH
        ];
    }

    /**
     * Petakan data setiap baris shipment ke kolom Excel,
     * dengan urutan yang persis sama seperti file import asli.
     *
     * @param Shipment $shipment
     */
    public function map($shipment): array
    {
        $this->rowNumber++;

        // Format tanggal entry
        $tglJamEntry = $shipment->tgl_jam_entry
            ? Carbon::parse($shipment->tgl_jam_entry)->format('d/m/Y H:i')
            : '';

        // Format tanggal received
        $tglReceived = $shipment->tgl_received
            ? Carbon::parse($shipment->tgl_received)->format('d-M-y')
            : '';

        return [
            $this->rowNumber,                                             // No (A)
            $shipment->pod_url ?: '',                                     // POD (B)
            (string) $shipment->awb,                                      // AWB (C) — teks murni
            '',                                                           // Keterangan (D) — kolom HTML di import, kosong saat export
            $tglJamEntry,                                                 // Tgl Jam Entry (E)
            $shipment->consignee_name ?: '',                              // Consignee Name (F)
            $shipment->adr1 ?: '',                                        // Adr1 (G)
            $shipment->adr2 ?: '',                                        // Adr2 (H)
            $shipment->adr3 ?: '',                                        // Adr3 (I)
            $shipment->origin_code ?: '',                                 // Origin Code (J)
            $shipment->destination_code ?: '',                            // Destination Code (K)
            $shipment->destination_name ?: '',                            // Detination Name (L)
            $shipment->service ?: '',                                     // Service (M)
            $shipment->weight !== null ? (float) $shipment->weight : '',  // Weight (N)
            $shipment->amount !== null ? (float) $shipment->amount : '',  // Amount (O)
            $shipment->coding ?: '',                                      // Coding (P)
            $shipment->status ?: '',                                      // Status (Q)
            $tglReceived,                                                 // Tgl Received (R)
            $shipment->receiver_reason ?: '',                             // Receiver Reason (S)
            $shipment->latlong ?: '',                                     // Latlong (T)
            $shipment->pod_picture ?: '',                                 // POD Picture (U)
            $shipment->pod_signature ?: '',                               // POD Signature (V)
            $shipment->foto_pod_1 ?: '',                                  // Foto POD 1 (W)
            $shipment->foto_pod_2 ?: '',                                  // Foto POD 2 (X)
            $shipment->foto_pod_3 ?: '',                                  // Foto POD 3 (Y)
            $shipment->foto_pod_4 ?: '',                                  // Foto POD 4 (Z)
            $shipment->foto_pod_5 ?: '',                                  // Foto POD 5 (AA)
            $shipment->foto_pod_6 ?: '',                                  // Foto POD 6 (AB)
            $shipment->foto_pod_7 ?: '',                                  // Foto POD 7 (AC)
            $shipment->is_success ? 1 : 0,                                // Success (AD)
            $shipment->is_failed ? 1 : 0,                                 // Failed (AE)
            $shipment->is_on_delivery ? 1 : 0,                            // On Delivery (AF)
            $shipment->is_on_process ? 1 : 0,                             // On Process (AG)
            $shipment->runsheet_no ?: '',                                  // Runsheet No (AH)
        ];
    }

    public function columnFormats(): array
    {
        return [
            'C' => NumberFormat::FORMAT_TEXT,      // AWB wajib format teks murni agar digit panjang tidak rusak
            'N' => '#,##0.00',                    // Format desimal untuk berat (kg)
            'O' => '#,##0',                       // Format rupiah untuk tarif (amount)
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow  = $sheet->getHighestRow();
        $lastCol  = 'AH'; // Kolom terakhir

        // 1. Header Styling (Baris 1) — JNE Navy dengan teks putih tebal
        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '10264A'], // Navy khas JNE
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(30);

        // 2. Alignment & Border Data jika ada baris data
        if ($lastRow > 1) {
            // No — center
            $sheet->getStyle("A2:A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            // AWB — left (agar nomor panjang terbaca)
            $sheet->getStyle("C2:C{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            // Tgl Jam Entry — center
            $sheet->getStyle("E2:E{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            // Origin & Destination codes — center
            $sheet->getStyle("J2:K{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            // Service — center
            $sheet->getStyle("M2:M{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            // Status — center
            $sheet->getStyle("Q2:Q{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            // Tgl Received — center
            $sheet->getStyle("R2:R{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            // Success/Failed/On Delivery/On Process — center
            $sheet->getStyle("AD2:AG{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Beri border halus di semua cell data
            $sheet->getStyle("A1:{$lastCol}{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['rgb' => 'E2E8F0'],
                    ],
                ],
            ]);
        }

        return [];
    }
}
