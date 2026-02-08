<?php

namespace App\Services;

use App\Models\OrdenTrabajo;
use Barryvdh\DomPDF\Facade\Pdf;

class OrdenTrabajoPDFService
{
    /**
     * Generate PDF for a work order
     */
    public function generatePDF(OrdenTrabajo $orden): \Barryvdh\DomPDF\PDF
    {
        // Load the orden with relationships
        $orden->load(['equipo', 'tecnicoAsignado']);

        // Prepare data for the view
        $data = [
            'orden' => $orden,
            'fechaGeneracion' => now()->format('d/m/Y H:i'),
        ];

        // Generate PDF
        $pdf = Pdf::loadView('pdf.orden-trabajo', $data);
        
        // Set paper size and orientation
        $pdf->setPaper('letter', 'portrait');
        
        return $pdf;
    }

    /**
     * Get the filename for the PDF
     */
    public function getFilename(OrdenTrabajo $orden): string
    {
        return 'orden-trabajo-' . $orden->numero_orden . '.pdf';
    }
}
