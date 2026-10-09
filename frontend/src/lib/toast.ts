import { toast as sonner } from "sonner";
import { playSound } from "./sounds";

// Drop-in replacement for sonner's toast: success plays the confirm sound and error plays the error sound.
export const toast = Object.assign((...args: Parameters<typeof sonner>) => sonner(...args), sonner, {
  success: (...args: Parameters<typeof sonner.success>) => { playSound("confirm"); return sonner.success(...args); },
  error: (...args: Parameters<typeof sonner.error>) => { playSound("error"); return sonner.error(...args); },
});
