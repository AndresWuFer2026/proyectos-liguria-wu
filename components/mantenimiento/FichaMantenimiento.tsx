"use client";

import { useEffect, useState } from "react";
import {
  getEstadoOrdenTrabajoLabel,
  obtenerFichaMantenimientoPorOrden,
  type FichaMantenimientoData,
} from "@/services/mantenimiento.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

const emptyMessage = "No se ingresó información.";

export function FichaMantenimiento({ ordenId }: { ordenId: string }) {
  const [data, setData] = useState<FichaMantenimientoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function cargarFicha() {
      try {
        const result = await obtenerFichaMantenimientoPorOrden(ordenId);

        if (mounted) {
          setData(result);
          setErrorMessage(result ? null : "Orden de trabajo no encontrada.");
        }
      } catch (error) {
        console.error("Error cargando ficha:", error);
        if (mounted) {
          setData(null);
          setErrorMessage(getServiceErrorMessage(error));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    cargarFicha();

    return () => {
      mounted = false;
    };
  }, [ordenId]);

  if (loading) {
    return <div className="p-8 text-slate-500">Cargando ficha...</div>;
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage || "Ficha no disponible."}
        </div>
      </div>
    );
  }

  const { orden } = data;
  const ficha = data.ficha ?? {};
  const fichaCerrada = orden.estado === "CERRADA" && Boolean(data.ficha);

  function exportarPdf() {
    window.print();
  }

  function exportarExcel() {
    const rows = [
      ["OT", orden.codigo],
      [
        "Activo",
        `${orden.activoCodigo || ""} ${orden.activoNombre || ""}`.trim(),
      ],
      ["Estado", getEstadoOrdenTrabajoLabel(orden.estado)],
      ["Tipo", orden.tipoMantenimiento || emptyMessage],
      ["Especialidad", orden.especialidad || emptyMessage],
      [
        "Responsable",
        orden.tecnicoAsignado || orden.responsable || emptyMessage,
      ],
      [
        "Observaciones",
        fieldValue(ficha, ["observaciones"]) ||
          orden.observacionesEjecucion ||
          emptyMessage,
      ],
    ];
    const table = rows
      .map(
        ([label, value]) =>
          `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
      )
      .join("");
    const blob = new Blob([`<table>${table}</table>`], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${orden.codigo}-ficha.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-slate-500">{orden.codigo}</p>
            <h1 className="text-2xl font-bold text-slate-800">
              Ficha de Mantenimiento
            </h1>
            <p className="text-sm text-slate-500">
              {orden.activoCodigo && `${orden.activoCodigo} - `}
              {orden.activoNombre || "Activo no registrado"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportarPdf}
              className="rounded-lg border border-[#0F3D56] px-4 py-2 text-sm font-medium text-[#0F3D56] hover:bg-slate-50"
            >
              Exportar PDF
            </button>
            <button
              onClick={exportarExcel}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        {!fichaCerrada && (
          <div className="mx-6 mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Ficha preliminar. Se guardará como historial y reporte cuando el
            supervisor valide el cierre de la OT.
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-100">
          <InfoCard title="Estado OT" value={getEstadoOrdenTrabajoLabel(orden.estado)} />
          <InfoCard
            title="Tipo"
            value={orden.tipoMantenimiento || emptyMessage}
          />
          <InfoCard
            title="Especialidad"
            value={orden.especialidad || emptyMessage}
          />
          <InfoCard
            title="Responsable"
            value={orden.tecnicoAsignado || orden.responsable || emptyMessage}
          />
        </div>

        <div className="p-6 space-y-6">
          <Section title="Información General">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <Field label="Código OT" value={orden.codigo} />
              <Field label="Fecha programada" value={orden.fechaProgramada} />
              <Field label="Estado" value={getEstadoOrdenTrabajoLabel(orden.estado)} />
              <Field label="Prioridad" value={orden.prioridad} />
              <Field
                label="Hora inicio"
                value={fieldValue(ficha, ["hora_inicio"]) || orden.horaInicio}
              />
              <Field
                label="Hora fin"
                value={fieldValue(ficha, ["hora_fin"]) || orden.horaFin}
              />
              <Field
                label="Duración estimada"
                value={
                  orden.duracionEstimadaHoras
                    ? `${orden.duracionEstimadaHoras} horas`
                    : null
                }
              />
            </div>
          </Section>

          <Section title="Activo">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <Field label="Código activo" value={orden.activoCodigo} />
              <Field label="Activo" value={orden.activoNombre} />
              <Field
                label="Condición final"
                value={fieldValue(ficha, ["estado_final"]) || orden.estadoFinal}
              />
            </div>
          </Section>

          <Section title="Personal">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <Field label="Responsable" value={orden.responsable} />
              <Field label="Técnico asignado" value={orden.tecnicoAsignado} />
              <Field
                label="Horas hombre"
                value={
                  fieldValue(ficha, ["horas_hombre", "horas"]) ||
                  (orden.horasHombre ? String(orden.horasHombre) : null)
                }
              />
            </div>
          </Section>

          <Section title="Descripción">
            <Field label="Trabajo solicitado" value={orden.descripcion} />
          </Section>

          <Section title="Checklist">
            <Rows data={data.checklist} />
          </Section>

          <Section title="Hallazgos">
            <Rows data={data.hallazgos} />
          </Section>

          <Section title="Repuestos">
            <Rows data={data.repuestos} />
          </Section>

          <Section title="Herramientas">
            <Rows data={data.herramientas} />
          </Section>

          <Section title="Materiales">
            <Rows data={data.materiales} />
          </Section>

          <Section title="Horas Hombre">
            <Rows data={data.manoObra} />
          </Section>

          <Section title="Observaciones">
            <Field
              label="Observaciones de ejecución"
              value={
                fieldValue(ficha, ["observaciones", "recomendaciones"]) ||
                orden.observacionesEjecucion
              }
            />
          </Section>

          <Section title="Fotografías">
            <Rows data={data.evidencias} />
          </Section>

          <Section title="Firmas">
            <Field
              label="Firma digital"
              value={fieldValue(ficha, ["firma_digital", "firma", "firmas"])}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 font-semibold text-[#0F3D56]">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-semibold text-slate-800 mb-3">{title}</h2>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">
        {value?.trim() ? value : emptyMessage}
      </p>
    </div>
  );
}

function Rows({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((row, index) => (
        <div
          key={`${String(row.id ?? "row")}-${index}`}
          className="rounded-lg bg-white border border-slate-200 p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {Object.entries(row)
              .filter(([, value]) => value !== null && value !== "")
              .map(([key, value]) => {
                const textValue = String(value);

                return (
                  <div key={key}>
                    <Field label={key.replaceAll("_", " ")} value={textValue} />
                    {isImageValue(textValue) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={textValue}
                        alt={key}
                        className="mt-3 h-36 w-full rounded-lg border border-slate-200 object-cover"
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function isImageValue(value: string) {
  return (
    /^https?:\/\//i.test(value) &&
    /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(value)
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fieldValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}
