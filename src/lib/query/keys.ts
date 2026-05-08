export const ticketKeys = {
  all: ["tickets"] as const,
  list: () => [...ticketKeys.all, "list"] as const,
  detail: (id: string) => [...ticketKeys.all, "detail", id] as const,
};

export const vehicleKeys = {
  all: ["vehicles"] as const,
  list: () => [...vehicleKeys.all, "list"] as const,
};

export const invoiceKeys = {
  all: ["invoices"] as const,
  byTicket: (ticketId: string) => [...invoiceKeys.all, ticketId] as const,
};

export const analyticsKeys = {
  today: ["analytics", "today"] as const,
};

export const meKeys = {
  current: ["me"] as const,
};
