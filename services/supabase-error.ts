export function getServiceErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Error desconocido.";
}

export function isMissingColumnError(error: unknown, column: string) {
  const message = getServiceErrorMessage(error).toLowerCase();
  return (
    message.includes(column.toLowerCase()) &&
    (message.includes("column") || message.includes("schema cache"))
  );
}

export function isMissingTableError(error: unknown, table: string) {
  const message = getServiceErrorMessage(error).toLowerCase();
  return (
    message.includes(table.toLowerCase()) &&
    (message.includes("relation") ||
      message.includes("table") ||
      message.includes("schema cache"))
  );
}
