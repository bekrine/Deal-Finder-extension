import { ExtensionMessage } from './types';
import { handleExtensionMessage } from '../background/service-worker';

export const isRealExtension =
  typeof chrome !== 'undefined' &&
  Boolean(chrome?.runtime?.id);

/**
 * Dispatches an extension message to the background service worker.
 * Works seamlessly in both unpacked Chrome Extension runtime and the local web simulator.
 */
export async function sendExtensionMessage<T = any>(message: ExtensionMessage): Promise<T> {
  if (isRealExtension && chrome.runtime?.sendMessage) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Cross-environment simulator: execute the background worker logic directly
  try {
    const res = await handleExtensionMessage(message);
    return res as T;
  } catch (err) {
    throw err;
  }
}
