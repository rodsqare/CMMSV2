<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orden de Trabajo - {{ $orden->numero_orden }}</title>
    <style>
        @page {
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1a1a1a;
        }
        
        /* Hospital header section with logos and branding */
        .hospital-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #00A3E0;
        }
        
        .hospital-header h1 {
            font-size: 20px;
            color: #00A3E0;
            margin: 0 0 3px 0;
            font-weight: bold;
        }
        
        .hospital-header h2 {
            font-size: 14px;
            margin: 2px 0;
            font-weight: bold;
            color: #000;
        }
        
        .hospital-header .location {
            font-size: 12px;
            margin: 2px 0;
            color: #000;
        }
        
        .hospital-header .motto {
            font-size: 9px;
            font-style: italic;
            color: #666;
            margin-top: 3px;
        }
        
        /* Header section with dark background similar to the reference design */
        .header {
            background: #1a1a1a;
            color: white;
            padding: 20px;
            margin-bottom: 0;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
        }
        
        .header h2 {
            font-size: 14px;
            font-weight: normal;
            color: #e5e5e5;
            letter-spacing: 0.3px;
        }
        
        /* Two-column grid for order info and area similar to reference */
        .info-header {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }
        
        .info-header-row {
            display: table-row;
        }
        
        .info-header-cell {
            display: table-cell;
            width: 50%;
            padding: 15px 20px;
            border: 2px solid #1a1a1a;
            vertical-align: top;
        }
        
        .info-header-label {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 5px;
            color: #666;
        }
        
        .info-header-value {
            font-size: 12px;
            font-weight: bold;
            color: #1a1a1a;
        }
        
        /* Full-width responsible person section */
        .responsible-section {
            padding: 12px 20px;
            border-left: 2px solid #1a1a1a;
            border-right: 2px solid #1a1a1a;
            border-bottom: 2px solid #1a1a1a;
            background: #fafafa;
        }
        
        .responsible-label {
            font-weight: bold;
            font-size: 10px;
            display: inline;
            color: #1a1a1a;
        }
        
        .responsible-value {
            font-size: 11px;
            display: inline;
            color: #1a1a1a;
        }
        
        /* Equipment details section with structured layout */
        .equipment-section {
            padding: 20px;
            border: 2px solid #1a1a1a;
            margin-top: 0;
            background: white;
        }
        
        .equipment-row {
            margin-bottom: 8px;
        }
        
        .equipment-label {
            font-weight: bold;
            display: inline;
            color: #1a1a1a;
            font-size: 10px;
        }
        
        .equipment-value {
            display: inline;
            color: #333;
            font-size: 11px;
        }
        
        /* Activities section with bullet points */
        .activities-section {
            padding: 20px;
            border-left: 2px solid #1a1a1a;
            border-right: 2px solid #1a1a1a;
            border-bottom: 2px solid #1a1a1a;
            margin-top: 0;
        }
        
        .activities-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 10px;
            color: #1a1a1a;
        }
        
        .activities-list {
            margin-left: 20px;
        }
        
        .activities-list li {
            margin-bottom: 5px;
            color: #333;
            font-size: 10px;
        }
        
        /* Observations section */
        .observations-section {
            padding: 15px 20px;
            border-left: 2px solid #1a1a1a;
            border-right: 2px solid #1a1a1a;
            border-bottom: 2px solid #1a1a1a;
            margin-top: 0;
        }
        
        .observations-title {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 8px;
            color: #1a1a1a;
        }
        
        .observations-content {
            color: #333;
            font-size: 10px;
            line-height: 1.6;
        }
        
        /* Signature section split into two columns */
        .signatures-section {
            display: table;
            width: 100%;
            border-collapse: collapse;
            margin-top: 0;
        }
        
        .signatures-row {
            display: table-row;
        }
        
        .signatures-cell {
            display: table-cell;
            width: 50%;
            padding: 20px;
            border: 2px solid #1a1a1a;
            vertical-align: top;
        }
        
        .signature-group {
            margin-bottom: 15px;
        }
        
        .signature-label {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 15px;
            color: #1a1a1a;
        }
        
        .signature-line {
            border-bottom: 2px solid #1a1a1a;
            width: 100%;
            height: 25px;
            margin-top: 10px;
        }
        
        .execution-date-label {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 10px;
            color: #1a1a1a;
        }
        
        .execution-date-value {
            font-size: 14px;
            color: #1a1a1a;
        }
        
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .badge-prioridad-urgente {
            background: #fee;
            color: #c00;
        }
        
        .badge-prioridad-alta {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge-prioridad-media {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge-prioridad-baja {
            background: #dbeafe;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Hospital header with branding -->
        <div class="hospital-header">
            <h1>HOSPITAL</h1>
            <h2>"DR. BENIGNO SÁNCHEZ"</h2>
            <div class="location">QUILLACOLLO</div>
            <div class="motto">"La salud del paciente, es más importante que la vida de su médico"</div>
        </div>

        <!-- Header with dark background -->
        <div class="header">
            <h1>ORDEN DE TRABAJO</h1>
            <h2>MANTENIMIENTO {{ strtoupper($orden->tipo) }}</h2>
        </div>

        <!-- Order info and area grid -->
        <div class="info-header">
            <div class="info-header-row">
                <div class="info-header-cell">
                    <div class="info-header-label">Nº de Orden:</div>
                    <div class="info-header-value">{{ $orden->numero_orden }}</div>
                    <div class="info-header-label" style="margin-top: 10px;">Fecha de Emisión:</div>
                    <div class="info-header-value">{{ $orden->fecha_creacion ? $orden->fecha_creacion->format('d/m/Y') : 'N/A' }}</div>
                </div>
                <div class="info-header-cell">
                    <div class="info-header-label">Área/Departamento:</div>
                    <div class="info-header-value">{{ $orden->equipo->ubicacion ?? 'N/A' }}</div>
                </div>
            </div>
        </div>

        <!-- Responsible person section -->
        <div class="responsible-section">
            <span class="responsible-label">Responsable del Mantenimiento:</span>
            <span class="responsible-value">{{ $orden->tecnicoAsignado->nombre ?? 'Sin asignar' }}</span>
        </div>

        <!-- Equipment details section -->
        <div class="equipment-section">
            <div class="equipment-row">
                <span class="equipment-label">Equipo/Activo:</span>
                <span class="equipment-value">{{ $orden->equipo->nombre_equipo ?? 'N/A' }} - {{ $orden->equipo->modelo ?? '' }}</span>
            </div>
            <div class="equipment-row">
                <span class="equipment-label">Ubicación:</span>
                <span class="equipment-value">{{ $orden->equipo->ubicacion ?? 'N/A' }}</span>
            </div>
            <div class="equipment-row">
                <span class="equipment-label">Tipo de Mantenimiento:</span>
                <span class="equipment-value">{{ ucfirst($orden->tipo) }}</span>
            </div>
            <div class="equipment-row">
                <span class="equipment-label">Prioridad:</span>
                <span class="equipment-value">
                    <span class="badge badge-prioridad-{{ $orden->prioridad }}">
                        {{ strtoupper($orden->prioridad) }}
                    </span>
                </span>
            </div>
            <div class="equipment-row">
                <span class="equipment-label">Duración Estimada:</span>
                <span class="equipment-value">{{ number_format($orden->horas_trabajadas ?? 0, 1) }} horas</span>
            </div>
        </div>

        <!-- Activities section with structured list -->
        <div class="activities-section">
            <div class="activities-title">Actividades Programadas:</div>
            @if($orden->descripcion)
            <ul class="activities-list">
                @foreach(explode("\n", $orden->descripcion) as $line)
                    @if(trim($line))
                        <li>{{ trim($line) }}</li>
                    @endif
                @endforeach
            </ul>
            @else
            <ul class="activities-list">
                <li>Sin actividades especificadas.</li>
            </ul>
            @endif
        </div>

        <!-- Observations section -->
        @if($orden->observaciones || $orden->notas)
        <div class="observations-section">
            <div class="observations-title">Observaciones Adicionales:</div>
            <div class="observations-content">
                {{ $orden->observaciones ?? $orden->notas ?? 'Sin observaciones' }}
            </div>
        </div>
        @endif

        <!-- Signatures section with two columns -->
        <div class="signatures-section">
            <div class="signatures-row">
                <div class="signatures-cell">
                    <div class="signature-group">
                        <div class="signature-label">Firmas:</div>
                        <div class="signature-label" style="margin-top: 20px;">Mecánico responsable:</div>
                        <div class="signature-line"></div>
                    </div>
                    <div class="signature-group" style="margin-top: 30px;">
                        <div class="signature-label">Supervisor:</div>
                        <div class="signature-line"></div>
                    </div>
                </div>
                <div class="signatures-cell">
                    <div class="signature-group">
                        <div class="execution-date-label">Fecha de ejecución:</div>
                        <div class="execution-date-value">_____ / _____ / _______</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
