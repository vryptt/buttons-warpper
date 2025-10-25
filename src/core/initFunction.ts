import { sendInteractiveMessage, sendButtons } from "./message.sender";
import { AuthoringPayload, SendButtonsPayload, SendOptions, WAMessage } from '../types';

export async function initFunction(sock: any) {
  sock.sendInteractiveMessage = async (
    jid: string,
    content: AuthoringPayload,
    options: SendOptions = {}
  ): Promise<WAMessage> => {
    return sendInteractiveMessage(sock, jid, content, options);
  };

  sock.sendButtons = async (
    jid: string,
    data: SendButtonsPayload,
    options: SendOptions = {}
  ): Promise<WAMessage> => {
    return sendButtons(sock, jid, data, options);
  };

  return sock;
}