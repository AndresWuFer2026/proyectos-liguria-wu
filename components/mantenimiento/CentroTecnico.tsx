"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  crearOrdenTrabajo,
  iniciarEjecucionOrdenTrabajo,
  listarOrdenesTrabajo,
  registrarEjecucionOrdenTrabajo,
  type EjecucionOrdenTrabajoInput,
  type OrdenTrabajo,
  type OrdenTrabajoInput,
} from "@/services/mantenimiento.service";
import {
  buscarActivoPorQrOCodigo,
  listarActivos,
  type Activo,
} from "@/services/activos.service";
import { getDemoUser, type DemoUser } from "@/services/auth.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

type BarcodeDetectorClass = new (options?: {
  formats?: string[];
}) => {
  detect: (image: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

const initialNuevaOt: OrdenTrabajoInput = {
  activoId: "",
  tipoMantenimiento: "CORRECTIVO PROGRAMADO",
  especialidad: "MECANICA",
  responsable: "",
  fechaProgramada: "",
  duracionEstimadaHoras: "2",
  descripcion: "",
  prioridad: "MEDIA",
};

const initialEjecucion: EjecucionOrdenTrabajoInput = {
  ordenId: "",
  horaInicio: "",
  horaFin: "",
  horasHombre: "",
  checklist: "",
  hallazgos: "",
  observaciones: "",
  fotografias: "",
  repuestos: "",
  herramientas: "",
  materiales: "",
  fotoAntes: "",
  fotoDespues: "",
  estadoFinal: "",
  firmaDigital: "",
};

export function CentroTecnico() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerFrameRef = useRef<number | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ejecucion, setEjecucion] =
    useState<EjecucionOrdenTrabajoInput>(initialEjecucion);
  const [nuevaOt, setNuevaOt] = useState<OrdenTrabajoInput>(initialNuevaOt);
  const [qrValue, setQrValue] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [mostrarNuevaOt, setMostrarNuevaOt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  useEffect(() => {
    let mounted = true;

    async function cargar() {
      try {
        const demoUser = getDemoUser();
        const [data, activosData] = await Promise.all([
          listarOrdenesTrabajo(),
          listarActivos(),
        ]);

        if (mounted) {
          setUser(demoUser);
          setOrdenes(data);
          setActivos(activosData);
          setNuevaOt((prev) => ({ ...prev, responsable: demoUser.name }));
        }
      } catch (error) {
        console.error("Error cargando centro técnico:", error);
        if (mounted) {
          setStatusType("error");
          setStatusMessage(getServiceErrorMessage(error));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    cargar();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (scannerFrameRef.current) {
        cancelAnimationFrame(scannerFrameRef.current);
        scannerFrameRef.current = null;
      }

      const stream = videoRef.current?.srcObject;

      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    },
    []
  );

  const misOrdenes = useMemo(
    () =>
      ordenes.filter((orden) => {
        const esOperativa =
          orden.estado === "ASIGNADA" || orden.estado === "EN_EJECUCION";
        const asignadaAlUsuario =
          !orden.tecnicoAsignado || orden.tecnicoAsignado === user?.name;
        return esOperativa && asignadaAlUsuario;
      }),
    [ordenes, user?.name]
  );

  const ordenSeleccionada = useMemo(
    () => ordenes.find((orden) => orden.id === ejecucion.ordenId) ?? null,
    [ejecucion.ordenId, ordenes]
  );

  async function recargar() {
    const [data, activosData] = await Promise.all([
      listarOrdenesTrabajo(),
      listarActivos(),
    ]);
    setOrdenes(data);
    setActivos(activosData);
  }

  async function buscarQr() {
    setStatusMessage(null);

    if (!qrValue.trim()) {
      setStatusType("error");
      setStatusMessage("Ingresa o escanea el token QR / código del activo.");
      return;
    }

    try {
      const activo = await buscarActivoPorQrOCodigo(qrValue);

      if (!activo) {
        setStatusType("error");
        setStatusMessage("No se encontró un activo con ese QR o código.");
        return;
      }

      router.push(`/activos/${activo.id}`);
    } catch (error) {
      console.error("Error buscando QR:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    }
  }

  function detenerScanner() {
    if (scannerFrameRef.current) {
      cancelAnimationFrame(scannerFrameRef.current);
      scannerFrameRef.current = null;
    }

    const stream = videoRef.current?.srcObject;

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerActive(false);
  }

  async function activarScanner() {
    setStatusMessage(null);

    const BarcodeDetector = (
      window as Window & { BarcodeDetector?: BarcodeDetectorClass }
    ).BarcodeDetector;

    if (!BarcodeDetector) {
      setStatusType("error");
      setStatusMessage(
        "Este navegador no soporta escaneo QR nativo. Pega el token o código del activo."
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatusType("error");
      setStatusMessage("No se encontró acceso a cámara en este navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScannerActive(true);

      const detector = new BarcodeDetector({ formats: ["qr_code"] });

      const scan = async () => {
        if (!videoRef.current) {
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          const qr = codes[0]?.rawValue;

          if (qr) {
            setQrValue(qr);
            setStatusType("success");
            setStatusMessage("QR detectado. Presiona Buscar para abrir el activo.");
            detenerScanner();
            return;
          }
        } catch {
          detenerScanner();
          setStatusType("error");
          setStatusMessage("No se pudo leer el QR. Intenta pegar el código.");
          return;
        }

        scannerFrameRef.current = requestAnimationFrame(scan);
      };

      scannerFrameRef.current = requestAnimationFrame(scan);
    } catch (error) {
      console.error("Error activando scanner:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
      detenerScanner();
    }
  }

  async function crearOtTecnico() {
    setStatusMessage(null);

    if (!nuevaOt.activoId || !nuevaOt.descripcion.trim()) {
      setStatusType("error");
      setStatusMessage("Selecciona activo y describe el trabajo solicitado.");
      return;
    }

    try {
      setGuardando(true);
      await crearOrdenTrabajo({
        ...nuevaOt,
        responsable: user?.name || nuevaOt.responsable || "Técnico",
      });
      setStatusType("success");
      setStatusMessage("OT ingresada y enviada a aprobación del supervisor.");
      setNuevaOt({
        ...initialNuevaOt,
        responsable: user?.name || "Técnico",
      });
      setMostrarNuevaOt(false);
      await recargar();
    } catch (error) {
      console.error("Error creando OT técnico:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  }

  async function iniciar(id: string) {
    setStatusMessage(null);

    try {
      await iniciarEjecucionOrdenTrabajo(id);
      setStatusType("success");
      setStatusMessage("OT iniciada.");
      setEjecucion((prev) => ({ ...prev, ordenId: id }));
      await recargar();
    } catch (error) {
      console.error("Error iniciando OT:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    }
  }

  async function registrar() {
    setStatusMessage(null);

    if (!ejecucion.ordenId || !ejecucion.horaInicio || !ejecucion.horaFin) {
      setStatusType("error");
      setStatusMessage("Completa OT, hora inicio y hora fin.");
      return;
    }

    try {
      setGuardando(true);
      await registrarEjecucionOrdenTrabajo(ejecucion);
      setStatusType("success");
      setStatusMessage("Ejecución enviada a validación del supervisor.");
      setEjecucion(initialEjecucion);
      await recargar();
    } catch (error) {
      console.error("Error registrando ejecución:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  }

  function update(campo: keyof EjecucionOrdenTrabajoInput, value: string) {
    setEjecucion((prev) => ({ ...prev, [campo]: value }));
  }

  function updateNuevaOt(campo: keyof OrdenTrabajoInput, value: string) {
    setNuevaOt((prev) => ({ ...prev, [campo]: value }));
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Centro de Trabajo del Técnico
        </h1>
        <p className="text-sm text-slate-500">
          Mis órdenes asignadas, ejecución y envío a validación.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            statusType === "success"
              ? "border-teal-200 bg-teal-50 text-teal-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <p className="text-sm font-semibold text-[#0F3D56]">
            Escanear QR / buscar activo
          </p>
          <p className="text-sm text-slate-500 mt-1">
            En beta puedes pegar el token QR o código del activo.
          </p>
          <div className="mt-4 flex gap-3">
            <input
              className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm"
              value={qrValue}
              onChange={(event) => setQrValue(event.target.value)}
              placeholder="QR token o LIG-CG-CM-CMP-001"
            />
            <button
              onClick={buscarQr}
              className="bg-[#0F3D56] hover:bg-[#0b3045] text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Buscar
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={activarScanner}
              className="rounded-lg border border-[#0F3D56] px-4 py-2 text-sm font-medium text-[#0F3D56] hover:bg-slate-50"
            >
              Escanear con cámara
            </button>
            {scannerActive && (
              <button
                onClick={detenerScanner}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Detener cámara
              </button>
            )}
          </div>
          <video
            ref={videoRef}
            className={`mt-4 h-48 w-full rounded-lg bg-slate-900 object-cover ${
              scannerActive ? "block" : "hidden"
            }`}
            muted
            playsInline
          />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <p className="text-sm font-semibold text-[#0F3D56]">
            Ingresar nueva OT
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Registra una solicitud rápida; el supervisor la aprueba y asigna.
          </p>
          <button
            onClick={() => setMostrarNuevaOt((prev) => !prev)}
            className="mt-4 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {mostrarNuevaOt ? "Ocultar formulario" : "+ Nueva OT"}
          </button>
        </div>
      </div>

      {mostrarNuevaOt && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">
            Solicitud de OT del técnico
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Activo"
              value={nuevaOt.activoId}
              onChange={(value) => updateNuevaOt("activoId", value)}
              options={activos.map((activo) => ({
                value: activo.id,
                label: `${activo.codigo_activo} - ${activo.nombre}`,
              }))}
            />
            <Select
              label="Tipo mantenimiento"
              value={nuevaOt.tipoMantenimiento}
              onChange={(value) => updateNuevaOt("tipoMantenimiento", value)}
              options={[
                "PREVENTIVO",
                "CORRECTIVO PROGRAMADO",
                "INSPECCION",
                "LUBRICACION",
                "CALIBRACION",
                "OVERHAUL",
              ].map((value) => ({ value, label: value }))}
            />
            <Select
              label="Prioridad"
              value={nuevaOt.prioridad}
              onChange={(value) => updateNuevaOt("prioridad", value)}
              options={["BAJA", "MEDIA", "ALTA", "CRITICA"].map((value) => ({
                value,
                label: value,
              }))}
            />
            <Input
              label="Especialidad"
              value={nuevaOt.especialidad}
              onChange={(value) => updateNuevaOt("especialidad", value)}
            />
            <Input
              label="Fecha programada"
              type="date"
              value={nuevaOt.fechaProgramada}
              onChange={(value) => updateNuevaOt("fechaProgramada", value)}
            />
            <Input
              label="Duración estimada"
              type="number"
              value={nuevaOt.duracionEstimadaHoras}
              onChange={(value) => updateNuevaOt("duracionEstimadaHoras", value)}
            />
            <div className="md:col-span-3">
              <Textarea
                label="Descripción del trabajo solicitado"
                value={nuevaOt.descripcion}
                onChange={(value) => updateNuevaOt("descripcion", value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setMostrarNuevaOt(false)}
              className="px-4 py-2 rounded-lg border text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={crearOtTecnico}
              disabled={guardando}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {guardando ? "Guardando..." : "Enviar a supervisor"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Mis OT</h2>
          <span className="text-sm text-slate-500">{misOrdenes.length} registros</span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-6 py-3">OT</th>
              <th className="text-left px-6 py-3">Activo</th>
              <th className="text-left px-6 py-3">Estado</th>
              <th className="text-right px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Cargando órdenes...
                </td>
              </tr>
            ) : misOrdenes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No hay OT asignadas al técnico.
                </td>
              </tr>
            ) : (
              misOrdenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-[#0F3D56]">
                    {orden.codigo}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {orden.activoCodigo && `${orden.activoCodigo} - `}
                    {orden.activoNombre || "No registrado"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                      {orden.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/fichas/${orden.id}`}
                        className="text-slate-600 font-medium hover:underline"
                      >
                        Ficha
                      </Link>
                      {orden.estado === "ASIGNADA" && (
                        <button
                          onClick={() => iniciar(orden.id)}
                          className="text-[#0F3D56] font-medium hover:underline"
                        >
                          Iniciar
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setEjecucion((prev) => ({ ...prev, ordenId: orden.id }))
                        }
                        className="text-teal-600 font-medium hover:underline"
                      >
                        Registrar ejecución
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {ejecucion.ordenId && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-800">Formulario de ejecución</h2>
            <p className="text-sm text-slate-500">
              {ordenSeleccionada?.codigo || "OT seleccionada"} -{" "}
              {ordenSeleccionada?.activoNombre || "Activo no registrado"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Hora inicio"
              type="time"
              value={ejecucion.horaInicio}
              onChange={(value) => update("horaInicio", value)}
            />
            <Input
              label="Hora fin"
              type="time"
              value={ejecucion.horaFin}
              onChange={(value) => update("horaFin", value)}
            />
            <Input
              label="Horas hombre"
              type="number"
              value={ejecucion.horasHombre}
              onChange={(value) => update("horasHombre", value)}
            />
            <Textarea label="Checklist" value={ejecucion.checklist} onChange={(value) => update("checklist", value)} />
            <Textarea label="Actividades realizadas" value={ejecucion.observaciones} onChange={(value) => update("observaciones", value)} />
            <Textarea label="Hallazgos" value={ejecucion.hallazgos} onChange={(value) => update("hallazgos", value)} />
            <Textarea label="Repuestos" value={ejecucion.repuestos} onChange={(value) => update("repuestos", value)} />
            <Textarea label="Herramientas" value={ejecucion.herramientas} onChange={(value) => update("herramientas", value)} />
            <Textarea label="Materiales" value={ejecucion.materiales} onChange={(value) => update("materiales", value)} />
            <Textarea label="Evidencias generales" value={ejecucion.fotografias} onChange={(value) => update("fotografias", value)} />
            <Input label="Foto antes / URL" value={ejecucion.fotoAntes} onChange={(value) => update("fotoAntes", value)} />
            <Input label="Foto después / URL" value={ejecucion.fotoDespues} onChange={(value) => update("fotoDespues", value)} />
            <Input label="Estado final del equipo" value={ejecucion.estadoFinal} onChange={(value) => update("estadoFinal", value)} />
            <Input label="Firma digital" value={ejecucion.firmaDigital} onChange={(value) => update("firmaDigital", value)} />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setEjecucion(initialEjecucion)}
              className="px-4 py-2 rounded-lg border text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={registrar}
              disabled={guardando}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {guardando ? "Enviando..." : "Enviar a validación"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <select
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <input
        type={type}
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <textarea
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
