import jsPDF from "jspdf";
import "jspdf-autotable";

export function exportLogsPDF(logs) {
    const doc = new jsPDF();
    doc.text("Logs Export", 14, 16);

    const rows = logs.map((l) => [
        l.id,
        l.computer_name,
        l.ip,
        l.error_type,
        l.status
    ]);

    doc.autoTable({
        head: [["ID", "Computer", "IP", "Error", "Status"]],
        body: rows,
    });

    doc.save("logs.pdf");
}
