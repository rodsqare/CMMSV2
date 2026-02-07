import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "-"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  } catch (error) {
    return "-"
  }
}

async function addHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  try {
    // Load hospital logo (left side)
    const hospitalLogo = await loadImage("/images/design-mode/logo")
    doc.addImage(hospitalLogo, "PNG", 15, 10, 30, 30)
  } catch (error) {
    console.log("[v0] Hospital logo not loaded, using placeholder")
    // Placeholder circle for hospital logo
    doc.setFillColor(0, 163, 224)
    doc.circle(30, 25, 15, "F")
  }

  try {
    // Load government logo (right side)
    const govLogo = await loadImage("/images/design-mode/Gobierno.jpg")
    doc.addImage(govLogo, "JPEG", pageWidth - 45, 10, 30, 30)
  } catch (error) {
    console.log("[v0] Government logo not loaded, using placeholder")
    // Placeholder circle for government logo
    doc.setFillColor(0, 163, 224)
    doc.circle(pageWidth - 30, 25, 15, "F")
  }

  // Hospital name and details (center)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 163, 224)
  doc.text("HOSPITAL", pageWidth / 2, 15, { align: "center" })

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text('"DR. BENIGNO SÁNCHEZ"', pageWidth / 2, 22, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("QUILLACOLLO", pageWidth / 2, 28, { align: "center" })

  // Motto
  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text('"La salud del paciente, es más importante que la vida de su médico"', pageWidth / 2, 35, {
    align: "center",
  })

  // Divider line
  doc.setDrawColor(0, 163, 224)
  doc.setLineWidth(0.5)
  doc.line(15, 42, pageWidth - 15, 42)

  // Title section with turquoise background
  doc.setFillColor(0, 163, 224)
  doc.rect(15, 45, pageWidth - 30, 10, "F")
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(title, pageWidth / 2, 52, { align: "center" })
}

function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setDrawColor(0, 163, 224)
  doc.setLineWidth(0.3)
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text("Hospital Dr. Benigno Sánchez - Quillacollo", pageWidth / 2, pageHeight - 15, { align: "center" })
  doc.text(
    `Generado el: ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  )
}

export async function generatePDF(options: {
  tipo: "equipos" | "mantenimientos" | "ordenes" | "cronograma"
  fechaInicio?: string
  fechaFin?: string
  data: any
}) {
  const { tipo, fechaInicio, fechaFin, data } = options

  const doc = tipo === "cronograma" ? new jsPDF("landscape") : new jsPDF()

  // Add header with logos
  if (tipo === "equipos") {
    await addHeader(doc, "REPORTE DE EQUIPOS BIOMÉDICOS")
  } else if (tipo === "mantenimientos") {
    await addHeader(doc, "REPORTE DE MANTENIMIENTOS PROGRAMADOS")
  } else if (tipo === "ordenes") {
    await addHeader(doc, "REPORTE DE ÓRDENES DE TRABAJO")
  } else if (tipo === "cronograma") {
    return await generateCronogramaPDF(data, doc)
  }

  let yPos = 60

  // Date range info if provided
  if (fechaInicio || fechaFin) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    const rangoTexto = `Período: ${fechaInicio || "Inicio"} - ${fechaFin || "Actualidad"}`
    doc.text(rangoTexto, 15, yPos)
    yPos += 10
  }

  // Generate table based on type
  if (tipo === "equipos") {
    const tableData = data.map((eq) => [
      eq.nombre_equipo || eq.nombre || "-",
      eq.fabricante || eq.marca || "-",
      eq.modelo || "-",
      eq.numero_serie || eq.serie || "-",
      eq.ubicacion || "-",
      eq.estado || "-",
    ])
    autoTable(doc, {
      startY: yPos,
      head: [["Equipo", "Marca", "Modelo", "Serie", "Ubicación", "Estado"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 163, 224],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 15, right: 15 },
    })
  } else if (tipo === "mantenimientos") {
    const tableData = data.map((mant) => [
      mant.equipoNombre || mant.equipo || "-",
      mant.tipo || "-",
      mant.frecuencia || "-",
      formatDate(mant.proximaFecha),
      mant.estado || mant.resultado || "-",
      mant.estadoEquipo || "-",
    ])
    autoTable(doc, {
      startY: yPos,
      head: [["Equipo", "Tipo", "Frecuencia", "Próxima Fecha", "Estado", "Estado Equipo"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 163, 224],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 15, right: 15 },
    })
  } else {
    const tableData = data.map((orden) => [
      orden.equipoNombre || "-",
      orden.tipo || "-",
      orden.prioridad || "-",
      orden.estado || "-",
      formatDate(orden.fechaCreacion),
    ])
    autoTable(doc, {
      startY: yPos,
      head: [["Equipo", "Tipo", "Prioridad", "Estado", "Fecha Creación"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 163, 224],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 15, right: 15 },
    })
  }

  addFooter(doc)

  return doc
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename)
}

export async function generateEquipmentTechnicalSheet(equipment: any) {
  console.log("[v0] Equipment data received in PDF generator:", equipment)

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 10

  try {
    const hospitalLogo = await loadImage("/images/design-mode/logo")
    doc.addImage(hospitalLogo, "PNG", 15, yPos, 30, 30)
  } catch (error) {
    console.log("[v0] Hospital logo not loaded, using placeholder")
    doc.setFillColor(0, 163, 224)
    doc.circle(30, yPos + 15, 15, "F")
  }

  try {
    const govLogo = await loadImage("/images/design-mode/Gobierno.jpg")
    doc.addImage(govLogo, "JPEG", pageWidth - 45, yPos, 30, 30)
  } catch (error) {
    console.log("[v0] Government logo not loaded, using placeholder")
    doc.setFillColor(0, 163, 224)
    doc.circle(pageWidth - 30, yPos + 15, 15, "F")
  }

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 163, 224)
  doc.text("HOSPITAL", pageWidth / 2, yPos + 8, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text('"DR. BENIGNO SÁNCHEZ"', pageWidth / 2, yPos + 15, { align: "center" })

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text("QUILLACOLLO", pageWidth / 2, yPos + 21, { align: "center" })

  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text('"La salud del paciente, es más importante que la vida de su médico"', pageWidth / 2, yPos + 27, {
    align: "center",
  })

  yPos += 35

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.setFillColor(200, 220, 240)
  doc.rect(15, yPos, pageWidth - 30, 10, "FD")
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("FICHA TÉCNICA", pageWidth / 2, yPos + 6.5, { align: "center" })

  yPos += 12

  const leftColumnWidth = 115
  const rightColumnWidth = pageWidth - 30 - leftColumnWidth - 5

  const details = [
    ["Equipo:", equipment.nombre || "-"],
    ["Marca:", equipment.fabricante || "-"],
    ["Modelo:", equipment.modelo || "-"],
    ["Serie:", equipment.numeroSerie || "-"],
    ["Cód. Inst.:", equipment.codigoInstitucional || "-"],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: details,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 30, fillColor: [245, 245, 245] },
      1: { cellWidth: leftColumnWidth - 30 },
    },
    tableWidth: leftColumnWidth,
    margin: { left: 15 },
  })

  const rightColX = 15 + leftColumnWidth + 5

  // Hospital name header in right column
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.setFillColor(245, 245, 245)
  doc.rect(rightColX, yPos, rightColumnWidth, 10, "FD")
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("H. Benigno", rightColX + rightColumnWidth / 2, yPos + 4, { align: "center" })
  doc.text("Sánchez", rightColX + rightColumnWidth / 2, yPos + 8, { align: "center" })

  const contactDetails = [
    ["Servicio:", equipment.servicio || "-"],
    ["Venc. Garantía:", equipment.vencimientoGarantia || "-"],
    ["F. de Ingreso:", equipment.fechaIngreso || equipment.fechaInstalacion || "-"],
    ["Procedencia:", equipment.procedencia || "-"],
  ]

  autoTable(doc, {
    startY: yPos + 10,
    head: [],
    body: contactDetails,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 32, fillColor: [245, 245, 245] },
      1: { cellWidth: rightColumnWidth - 32 },
    },
    tableWidth: rightColumnWidth,
    margin: { left: rightColX },
  })

  yPos += 50

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.setFillColor(200, 220, 240)
  doc.rect(15, yPos, pageWidth - 30, 8, "FD")
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("ESPECIFICACIONES TÉCNICAS", pageWidth / 2, yPos + 5.5, { align: "center" })

  yPos += 8

  const specs = [
    ["Voltaje:", equipment.voltaje || "-", "Potencia:", equipment.potencia || "-"],
    ["Corriente:", equipment.corriente || "-", "Frecuencia:", equipment.frecuencia || "-"],
    ["Otros:", equipment.otrosEspecificaciones || "-", "", ""],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: specs,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 25, fillColor: [245, 245, 245] },
      1: { cellWidth: (pageWidth - 40) / 2 - 25 },
      2: { fontStyle: "bold", cellWidth: 25, fillColor: [245, 245, 245] },
      3: { cellWidth: (pageWidth - 40) / 2 - 25 },
    },
    margin: { left: 15, right: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 3

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.setFillColor(200, 220, 240)
  doc.rect(15, yPos, pageWidth - 30, 8, "FD")
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("ACCESORIOS / CONSUMIBLES", pageWidth / 2, yPos + 5.5, { align: "center" })

  yPos += 8

  const accessoriesHeight = 15
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.rect(15, yPos, pageWidth - 30, accessoriesHeight, "D")

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
  const accessories = equipment.accesoriosConsumibles || "-"
  const accesoriosLines = doc.splitTextToSize(accessories, pageWidth - 40)
  doc.text(accesoriosLines, 18, yPos + 4)

  yPos += accessoriesHeight + 3

  const sectionWidth = (pageWidth - 40) / 3
  let xPos = 15

  const checkboxSections = [
    {
      title: "ESTADO DE EQUIPO",
      options: ["Nuevo", "Operado", "No Operable"],
      checked:
        equipment.estadoEquipo === "nuevo"
          ? "Nuevo"
          : equipment.estadoEquipo === "no_operativo"
            ? "No Operable"
            : "Operado",
    },
    {
      title: "MANUALES",
      options: ["Usuario", "Servicio"],
      checked:
        equipment.manualUsuario && equipment.manualServicio
          ? "Usuario"
          : equipment.manualUsuario
            ? "Usuario"
            : equipment.manualServicio
              ? "Servicio"
              : null,
    },
    {
      title: "NIVEL DE RIESGO",
      options: ["Alto", "Medio", "Bajo"],
      checked: equipment.nivelRiesgo === "alto" ? "Alto" : equipment.nivelRiesgo === "bajo" ? "Bajo" : "Medio",
    },
  ]

  checkboxSections.forEach((section, index) => {
    // Section title with border
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)
    doc.setFillColor(200, 220, 240)
    doc.rect(xPos, yPos, sectionWidth - 1, 7, "FD")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(section.title, xPos + sectionWidth / 2 - 0.5, yPos + 4.5, { align: "center" })

    // Checkboxes in a bordered box
    const checkboxHeight = section.options.length * 5 + 4
    doc.rect(xPos, yPos + 7, sectionWidth - 1, checkboxHeight, "D")

    let checkY = yPos + 11
    section.options.forEach((option) => {
      let isChecked = false
      if (section.title === "MANUALES") {
        if (option === "Usuario" && equipment.manualUsuario) isChecked = true
        if (option === "Servicio" && equipment.manualServicio) isChecked = true
      } else {
        isChecked = section.checked === option
      }

      doc.setLineWidth(0.3)
      doc.rect(xPos + 3, checkY - 2, 3, 3, "D")

      if (isChecked) {
        doc.setLineWidth(0.5)
        doc.line(xPos + 3.5, checkY - 0.5, xPos + 4.2, checkY + 0.3)
        doc.line(xPos + 4.2, checkY + 0.3, xPos + 5.5, checkY - 1.5)
      }

      // Label
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(option, xPos + 8, checkY)
      checkY += 5
    })

    xPos += sectionWidth
  })

  yPos += 32

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.setFillColor(200, 220, 240)
  doc.rect(15, yPos, pageWidth - 30, 7, "FD")
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("DATOS DE PROVEEDOR:", pageWidth / 2, yPos + 4.5, { align: "center" })

  yPos += 7

  const providerData = [
    ["Nombre:", equipment.proveedorNombre || ""],
    ["Dirección:", equipment.proveedorDireccion || ""],
    ["Teléfono/Celular:", equipment.proveedorTelefono || ""],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: providerData,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38, fillColor: [245, 245, 245] },
      1: { cellWidth: pageWidth - 63 },
    },
    margin: { left: 15, right: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 3

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.setFillColor(200, 220, 240)
  doc.rect(15, yPos, pageWidth - 30, 7, "FD")
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("OBSERVACIONES", pageWidth / 2, yPos + 4.5, { align: "center" })

  yPos += 7
  doc.setLineWidth(0.3)
  doc.rect(15, yPos, pageWidth - 30, 25, "D")

  if (equipment.observaciones) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    const obsLines = doc.splitTextToSize(equipment.observaciones, pageWidth - 40)
    doc.text(obsLines, 18, yPos + 4)
  }

  addFooter(doc)

  return doc
}

export async function generateWorkOrderPDF(orden: any, equipo?: any) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 10

  const capitalizeFirst = (text: string): string => {
    if (!text) return ""
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return "$0.00"
    return `$${amount.toFixed(2)}`
  }

  const getCurrentDate = (): string => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Header with logos
  try {
    const hospitalLogo = await loadImage("/images/logo.png")
    doc.addImage(hospitalLogo, "PNG", 15, yPos, 30, 30)
  } catch (error) {
    console.log("[v0] Hospital logo not loaded, creating blue circle")
    doc.setFillColor(0, 163, 224)
    doc.circle(30, yPos + 15, 15, "F")
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("H", 30, yPos + 19, { align: "center" })
    doc.setTextColor(0, 0, 0)
  }

  try {
    const govLogo = await loadImage("/images/Gobierno.jpg")
    doc.addImage(govLogo, "JPEG", pageWidth - 45, yPos, 30, 30)
  } catch (error) {
    console.log("[v0] Government logo not loaded, creating blue circle")
    doc.setFillColor(0, 163, 224)
    doc.circle(pageWidth - 30, yPos + 15, 15, "F")
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("G", pageWidth - 30, yPos + 19, { align: "center" })
    doc.setTextColor(0, 0, 0)
  }

  // Hospital name and details (center)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 163, 224)
  doc.text("HOSPITAL", pageWidth / 2, yPos + 8, { align: "center" })

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text('"DR. BENIGNO SÁNCHEZ"', pageWidth / 2, yPos + 15, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("QUILLACOLLO", pageWidth / 2, yPos + 21, { align: "center" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  doc.text('"La salud del paciente, es más importante que la vida de su médico"', pageWidth / 2, yPos + 27, {
    align: "center",
  })

  yPos += 35

  // Divider line
  doc.setDrawColor(0, 163, 224)
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)

  yPos += 5

  // Green title banner
  doc.setFillColor(34, 197, 94)
  doc.rect(15, yPos, pageWidth - 30, 20, "F")

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("ORDEN DE TRABAJO", pageWidth / 2, yPos + 8, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  const tipoMant = capitalizeFirst(orden.tipo || "preventivo")
  doc.text(`MANTENIMIENTO ${tipoMant.toUpperCase()}`, pageWidth / 2, yPos + 15, { align: "center" })

  yPos += 25

  // Information grid - First row
  doc.setDrawColor(34, 197, 94) // Green color for borders
  doc.setLineWidth(0.5)

  const cellHeight = 12
  const halfWidth = (pageWidth - 30) / 2

  // Order number cell
  doc.rect(15, yPos, halfWidth, cellHeight, "D")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("N° de Orden:", 17, yPos + 4)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(orden.numeroOrden || `OT-${orden.id}`, 17, yPos + 9)

  // Department cell
  doc.rect(15 + halfWidth, yPos, halfWidth, cellHeight, "D")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Área/Departamento:", 17 + halfWidth, yPos + 4)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  const departamento = equipo?.servicio || orden.equipoServicio || "No especificado"
  doc.text(departamento, 17 + halfWidth, yPos + 9)

  yPos += cellHeight

  doc.rect(15, yPos, halfWidth, cellHeight, "D")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Fecha de Emisión:", 17, yPos + 4)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(formatDate(orden.fechaCreacion), 17, yPos + 9)

  // Fecha de Ejecución cell
  doc.rect(15 + halfWidth, yPos, halfWidth, cellHeight, "D")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Fecha de Ejecución:", 17 + halfWidth, yPos + 4)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(getCurrentDate(), 17 + halfWidth, yPos + 9)

  yPos += cellHeight + 5

  // Equipment section box
  const sectionHeight = 50
  doc.setLineWidth(0.5)
  doc.rect(15, yPos, pageWidth - 30, sectionHeight, "D")

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Equipo/Activo:", 17, yPos + 5)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  let detailY = yPos + 10

  doc.setFont("helvetica", "bold")
  doc.text("Nombre:", 17, detailY)
  doc.setFont("helvetica", "normal")
  const equipoNombre = orden.equipoNombre || equipo?.nombre || equipo?.nombre_equipo || "No especificado"
  doc.text(equipoNombre, 45, detailY)

  detailY += 5
  doc.setFont("helvetica", "bold")
  doc.text("Modelo:", 17, detailY)
  doc.setFont("helvetica", "normal")
  const modelo = equipo?.modelo || "No especificado"
  doc.text(modelo, 45, detailY)

  detailY += 5
  doc.setFont("helvetica", "bold")
  doc.text("Ubicación:", 17, detailY)
  doc.setFont("helvetica", "normal")
  const ubicacion = equipo?.ubicacion || "No especificada"
  doc.text(ubicacion, 45, detailY)

  detailY += 5
  doc.setFont("helvetica", "bold")
  doc.text("Tipo de Mantenimiento:", 17, detailY)

  doc.setFont("helvetica", "normal")
  const tipoText = capitalizeFirst(orden.tipo || "preventivo")
  doc.text(tipoText, 70, detailY)

  detailY += 5
  doc.setFont("helvetica", "bold")
  doc.text("Prioridad:", 17, detailY)

  doc.setFont("helvetica", "normal")
  const prioridadText = capitalizeFirst(orden.prioridad || "media")
  doc.text(prioridadText, 70, detailY)

  detailY += 5
  doc.setFont("helvetica", "bold")
  doc.text("Estado:", 17, detailY)

  doc.setFont("helvetica", "normal")
  const estadoText = capitalizeFirst((orden.estado || "").replace("_", " "))
  doc.text(estadoText, 70, detailY)

  yPos += sectionHeight + 5

  // Activities section
  const activitiesHeight = 30
  doc.setDrawColor(34, 197, 94)
  doc.rect(15, yPos, pageWidth - 30, activitiesHeight, "D")

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Descripción del Problema:", 17, yPos + 5)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  if (orden.descripcion) {
    const activities = orden.descripcion.split("\n").filter((a: string) => a.trim())
    let actY = yPos + 11
    activities.slice(0, 4).forEach((activity: string) => {
      const cleanActivity = activity.trim().replace(/^[•\-*]\s*/, "")
      doc.text("• " + cleanActivity, 19, actY)
      actY += 5
    })
  } else {
    doc.text("• No se especificó descripción", 19, yPos + 11)
  }

  yPos += activitiesHeight + 5

  // New section for Horas, Costos, and Observaciones
  const dataHeight = 25
  doc.setDrawColor(34, 197, 94)
  doc.rect(15, yPos, pageWidth - 30, dataHeight, "D")

  // Create a grid with 3 columns for the data
  const colWidth = (pageWidth - 30) / 3

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")

  // Column 1: Horas Trabajadas
  doc.text("Horas Trabajadas", 17, yPos + 5)
  doc.setFont("helvetica", "normal")
  doc.text(String(orden.horasTrabajadas || 0), 17, yPos + 10)

  // Column 2: Costo Repuestos
  doc.setFont("helvetica", "bold")
  doc.text("Costo Repuestos", 17 + colWidth, yPos + 5)
  doc.setFont("helvetica", "normal")
  doc.text(formatCurrency(orden.costoRepuestos), 17 + colWidth, yPos + 10)

  // Column 3: Costo Total
  doc.setFont("helvetica", "bold")
  doc.text("Costo Total", 17 + colWidth * 2, yPos + 5)
  doc.setFont("helvetica", "normal")
  doc.text(formatCurrency(orden.costoTotal), 17 + colWidth * 2, yPos + 10)

  // Observaciones (full width)
  doc.setFont("helvetica", "bold")
  doc.text("Observaciones", 17, yPos + 16)
  doc.setFont("helvetica", "normal")
  const obsText = orden.observaciones || "-"
  doc.text(obsText, 17, yPos + 21)

  yPos += dataHeight + 5

  // Signatures section
  const signatureHeight = 30
  doc.setDrawColor(34, 197, 94)

  const halfSignatureWidth = (pageWidth - 30) / 2

  // Left signature box - Firma Solicitante
  doc.rect(15, yPos, halfSignatureWidth, signatureHeight, "D")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Firma Solicitante:", 17, yPos + 5)

  // Right signature box - Firma Responsable
  doc.rect(15 + halfSignatureWidth, yPos, halfSignatureWidth, signatureHeight, "D")
  doc.text("Firma Responsable:", 17 + halfSignatureWidth, yPos + 5)
  doc.setFont("helvetica", "normal")
  const responsable = orden.tecnicoAsignadoNombre || "Admin Sistema"
  doc.text(responsable, 17 + halfSignatureWidth, yPos + 10)

  yPos += signatureHeight + 5

  addFooter(doc)

  return doc
}

async function generateCronogramaPDF(data: { equipos: any[]; mantenimientos: any[] }, doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 10

  // Header with logos
  try {
    const hospitalLogo = await loadImage("/images/logo.png")
    doc.addImage(hospitalLogo, "PNG", 15, yPos, 25, 25)
  } catch (error) {
    doc.setFillColor(0, 163, 224)
    doc.circle(27.5, yPos + 12.5, 12.5, "F")
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("H", 27.5, yPos + 16, { align: "center" })
    doc.setTextColor(0, 0, 0)
  }

  try {
    const govLogo = await loadImage("/images/Gobierno.jpg")
    doc.addImage(govLogo, "JPEG", pageWidth - 40, yPos, 25, 25)
  } catch (error) {
    doc.setFillColor(0, 163, 224)
    doc.circle(pageWidth - 27.5, yPos + 12.5, 12.5, "F")
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("G", pageWidth - 27.5, yPos + 16, { align: "center" })
    doc.setTextColor(0, 0, 0)
  }

  // Title
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  const currentYear = new Date().getFullYear()
  doc.text("CRONOGRAMA DE MANTENIMIENTO", pageWidth / 2, yPos + 8, { align: "center" })
  doc.setFontSize(14)
  doc.text(`GESTIÓN ${currentYear}`, pageWidth / 2, yPos + 15, { align: "center" })
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text('HOSPITAL "DR. BENIGNO SÁNCHEZ"', pageWidth / 2, yPos + 22, { align: "center" })

  yPos += 30

  doc.setDrawColor(0, 163, 224) // Blue color
  doc.setLineWidth(2)
  doc.line(10, yPos - 2, pageWidth - 10, yPos - 2)

  // Prepare data: Group maintenance by equipment and month
  const equiposConMantenimiento = data.equipos.map((equipo) => {
    const mantenimientos = data.mantenimientos.filter((m) => m.equipoId === equipo.id)

    const mesesMantenimiento: string[] = Array(12).fill("")

    mantenimientos.forEach((mant) => {
      if (mant.proximaFecha) {
        const fecha = new Date(mant.proximaFecha)
        const mes = fecha.getMonth() // 0-11
        // Marcar con P independientemente del tipo
        mesesMantenimiento[mes] = "P"
      }
    })

    return {
      numero: equipo.id || "-",
      equipo: equipo.nombre_equipo || equipo.nombre || "-",
      marca: equipo.fabricante || equipo.marca || "-",
      modelo: equipo.modelo || "-",
      serie: equipo.numero_serie || equipo.serie || "-",
      estado: equipo.estadoEquipo || equipo.estado || "operativo",
      meses: mesesMantenimiento,
    }
  })

  // Table headers
  const monthHeaders = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

  // Build table data
  const tableData = equiposConMantenimiento.map((item, index) => [
    (index + 1).toString(),
    item.equipo,
    item.marca,
    item.modelo,
    item.serie,
    item.estado.toUpperCase(),
    ...item.meses,
  ])

  autoTable(doc, {
    startY: yPos,
    head: [["N°", "EQUIPO", "MARCA", "MODELO", "SERIE", "ESTADO", ...monthHeaders]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [0, 163, 224],
      textColor: 255,
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" }, // N°
      1: { cellWidth: 35, halign: "left" }, // EQUIPO
      2: { cellWidth: 25, halign: "left" }, // MARCA
      3: { cellWidth: 25, halign: "left" }, // MODELO
      4: { cellWidth: 25, halign: "left" }, // SERIE
      5: { cellWidth: 20, halign: "center" }, // ESTADO
      // Months
      6: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      7: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      8: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      9: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      10: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      11: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      12: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      13: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      14: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      15: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      16: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
      17: { cellWidth: 12, halign: "center", fillColor: [200, 220, 255] },
    },
    margin: { left: 10, right: 10 },
    didParseCell: (data) => {
      if (data.column.index >= 6 && data.section === "body") {
        const cellValue = data.cell.text[0]
        if (cellValue && cellValue === "P") {
          data.cell.styles.fillColor = [144, 238, 144] // Light green
          data.cell.styles.fontStyle = "bold"
        }
      }
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 5

  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("P: MANTENIMIENTO PROGRAMADO", 15, finalY)

  // Footer
  doc.setFontSize(7)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(100, 100, 100)
  const footerY = doc.internal.pageSize.getHeight() - 10
  doc.text("Hospital Dr. Benigno Sánchez - Quillacollo", pageWidth / 2, footerY, { align: "center" })
  doc.text(
    `Generado el: ${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    pageWidth / 2,
    footerY + 3,
    { align: "center" },
  )

  return doc
}
