import { useEffect, useRef, useState } from "react";

const XLSX_CONTENT_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
    "application/zip",
];

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    })[character]);
}

function getExportDetails({ filters, summaryTotal, filteredTotal }) {
    const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value)),
    );
    const hasFilters = Object.keys(activeFilters).length > 0;
    const exportUrl = hasFilters
        ? `/resi/export?${new URLSearchParams(activeFilters)}`
        : "/resi/export?all=1";
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileParts = hasFilters ? ["Data_Resi"] : ["Data_Semua_Resi"];

    if (activeFilters.status) fileParts.push(activeFilters.status.replace(/\s+/g, "_"));
    if (activeFilters.action) fileParts.push(`Aksi_${activeFilters.action}`);
    if (activeFilters.three_lc) fileParts.push(`3LC_${activeFilters.three_lc}`);
    if (activeFilters.kabupaten) fileParts.push(activeFilters.kabupaten.replace(/\s+/g, "_"));
    if (activeFilters.date_from && activeFilters.date_to) {
        fileParts.push(`${activeFilters.date_from}_sd_${activeFilters.date_to}`);
    } else if (activeFilters.date_from) {
        fileParts.push(`dari_${activeFilters.date_from}`);
    } else if (activeFilters.date_to) {
        fileParts.push(`sampai_${activeFilters.date_to}`);
    }
    fileParts.push(dateStamp);

    const statusTitle = activeFilters.status
        || (activeFilters.action ? `Aksi: ${activeFilters.action}` : hasFilters ? "Sesuai Filter" : "Semua Resi");
    const dateRange = activeFilters.date_from && activeFilters.date_to
        ? `${activeFilters.date_from} s/d ${activeFilters.date_to}`
        : activeFilters.date_from
            ? `Dari ${activeFilters.date_from}`
            : activeFilters.date_to
                ? `Sampai ${activeFilters.date_to}`
                : null;

    return {
        exportUrl,
        fileName: `${fileParts.join("_")}.xlsx`,
        statusTitle,
        total: hasFilters ? filteredTotal : summaryTotal,
        search: activeFilters.search || null,
        dateRange,
    };
}

function getFileName(contentDisposition, fallbackName) {
    if (!contentDisposition) return fallbackName;

    const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (encodedName) {
        try {
            return decodeURIComponent(encodedName.replaceAll('"', ""));
        } catch {
            return fallbackName;
        }
    }

    return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || fallbackName;
}

async function readExportResponse(response, onProgress) {
    const total = Number(response.headers.get("Content-Length")) || 0;
    const contentType = response.headers.get("Content-Type") || XLSX_CONTENT_TYPES[0];
    const reader = response.body?.getReader();

    if (!reader) {
        const blob = await response.blob();
        onProgress({ total: blob.size, processed: blob.size });
        return blob;
    }

    const chunks = [];
    let processed = 0;
    onProgress({ total, processed });

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        processed += value.byteLength;
        onProgress({ total, processed });
    }

    return new Blob(chunks, { type: contentType });
}

export default function useShipmentExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(null);
    const [notice, setNotice] = useState(null);
    const downloadUrlRef = useRef(null);
    const revokeTimerRef = useRef(null);

    const revokeDownloadUrl = () => {
        if (revokeTimerRef.current) {
            window.clearTimeout(revokeTimerRef.current);
            revokeTimerRef.current = null;
        }

        if (downloadUrlRef.current) {
            URL.revokeObjectURL(downloadUrlRef.current);
            downloadUrlRef.current = null;
        }
    };

    useEffect(() => () => {
        if (revokeTimerRef.current) window.clearTimeout(revokeTimerRef.current);
        if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    }, []);

    const startExport = async (request) => {
        if (isExporting) return;

        revokeDownloadUrl();
        setNotice(null);
        setProgress(null);
        setIsExporting(true);

        const details = getExportDetails(request);

        try {
            const response = await fetch(details.exportUrl, {
                method: "GET",
                credentials: "same-origin",
                headers: { Accept: XLSX_CONTENT_TYPES.join(", ") },
            });

            if (!response.ok) {
                throw new Error(`Server merespons ${response.status}.`);
            }

            const contentType = response.headers.get("Content-Type")?.split(";")[0].trim();
            if (contentType && !XLSX_CONTENT_TYPES.includes(contentType)) {
                throw new Error("Server tidak mengirim file Excel. Muat ulang halaman lalu coba lagi.");
            }

            const blob = await readExportResponse(response, setProgress);
            if (blob.size === 0) throw new Error("File export kosong.");

            const fileName = getFileName(
                response.headers.get("Content-Disposition"),
                details.fileName,
            );
            const downloadUrl = URL.createObjectURL(blob);
            downloadUrlRef.current = downloadUrl;
            revokeTimerRef.current = window.setTimeout(revokeDownloadUrl, 60_000);

            const downloadLink = document.createElement("a");
            downloadLink.href = downloadUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            setNotice({
                type: "export",
                title: "File Siap Diunduh",
                message: `File Excel <strong>${escapeHtml(fileName)}</strong> sudah diterima dan unduhan telah dimulai.`,
                status: details.statusTitle,
                total: details.total,
                search: details.search,
                dateRange: details.dateRange,
                fileName,
                downloadUrl,
                time: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        } catch (error) {
            const message = escapeHtml(error.message || "Export gagal. Silakan coba kembali.");
            setNotice({
                type: "error",
                title: "Export Gagal",
                message,
                time: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        } finally {
            setIsExporting(false);
            setProgress(null);
        }
    };

    return {
        isExporting,
        progress,
        notice,
        setNotice,
        startExport,
    };
}
