import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportLogsExcel(logs) {
    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, "logs.xlsx");
}
