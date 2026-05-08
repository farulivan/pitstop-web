"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ticketKeys } from "@/lib/query/keys";
import { useWs } from "./provider";

export function useTicketSubscription(ticketId: string) {
  const ws = useWs();
  const queryClient = useQueryClient();

  useEffect(() => {
    return ws.subscribe(`ticket:${ticketId}`, (payload) => {
      queryClient.setQueryData(ticketKeys.detail(ticketId), payload);
    });
  }, [ws, queryClient, ticketId]);
}
