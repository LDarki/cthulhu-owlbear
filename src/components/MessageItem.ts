"use client";

import { html, LitElement, TemplateResult } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { property } from "lit/decorators.js";

interface Message {
  id: string;
  text: string;
  sender: string;
  senderRole: string;
  timestamp: Date;
  avatar?: string;
}

export class MessageItem extends LitElement {
  @property({ type: Object })
  message: Message = {
    id: "",
    text: "",
    sender: "",
    senderRole: "",
    timestamp: new Date(),
  };

  @property({ type: Boolean })
  isUser: boolean = false;

  createRenderRoot() {
    return this;
  }

  render(): TemplateResult {
    const isGm = this.message.senderRole === "GM";

    const messageClasses = {
      flex: true,
      "items-start": true,
      "gap-3": true,
      "w-full": true,
      "mt-2": true,
      "justify-start": !this.isUser,
      "flex-row-reverse": this.isUser,
    };

    const bubbleClasses = {
      "px-4": true,
      "py-2": true,
      "w-fit": true,
      "max-w-[80%]": true,
      "rounded-lg": true,
      "backdrop-blur-lg": true,
      "bg-purple-600/70": this.isUser,
      "text-white": this.isUser,
      "bg-gray-800/70": !this.isUser,
      "text-gray-100": !this.isUser,
      border: true,
      "border-purple-500/30": this.isUser,
      "border-gray-700/50": !this.isUser,
      "flex": true,
      "flex-col": true,
    };

    return html`
      <div class=${classMap(messageClasses)}>

        <div
          class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mt-1 shrink-0"
        >
          <img
            src="${this.message.avatar}"
            alt="Avatar"
            class="w-full h-full object-cover"
          />
        </div>

        <div class=${classMap(bubbleClasses)}>

          <div class="inline-flex ${this.isUser
                ? "justify-end"
                : "justify-start"} items-center text-xs w-full">
            <span
              class=${this.isUser
                ? "text-purple-300"
                : "text-gray-400"}
            >
                ${this.message.sender}
            </span>
          </div>

          <p class="break-words whitespace-pre-wrap">${this.message.text}</p>

          <div class="inline-flex justify-between items-center text-xs mt-2 w-full">
            ${isGm
              ? html`
                <span
                class="px-2 py-0.5 mr-4 bg-yellow-500/80 text-white text-center rounded-full font-bold text-xs leading-none"
                >
                    GM
                </span>
                `
              : html`<span></span>`}

            <span
              class=${this.isUser
                ? "text-purple-300"
                : "text-gray-400"}
            >
              ${this.formatTime(this.message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

customElements.define("message-item", MessageItem);
