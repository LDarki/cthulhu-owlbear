import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@/components/MessageItem';
import OBR from '@owlbear-rodeo/sdk';
import { generateAvatar } from '@/utils/Avatar';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  text: string;
  sender: string;
  senderRole: string;
  timestamp: Date;
  avatar?: string;
  isOwner: boolean;
}

@customElement('chat-windows')
export class ChatWindows extends LitElement {
  @property({ type: Array })
  messages: Message[] = [];

  @property({ type: String })
  inputValue: string = '';

  @property({ type: String })
  cacheAvatar: string = '';

  constructor() {
    super();
    this.messages = [];
  }

  connectedCallback() {
    super.connectedCallback();

    OBR.onReady(async () => {
      OBR.broadcast.onMessage('cthulhu.message', async (message: any) => {
        const messageObject = message.data as Message;

        if (typeof messageObject.timestamp === 'string') {
          messageObject.timestamp = new Date(messageObject.timestamp);
        }
        
        if(messageObject.senderRole === 'GM') await OBR.notification.show('Nuevo mensaje del GameMaster', 'INFO');

        messageObject.text = DOMPurify.sanitize(messageObject.text);

        this.messages = [...this.messages, messageObject];
        this.requestUpdate();
      });
    }); 
  }

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div class="flex flex-col min-h-screen text-gray-100 relative">
        <div class="border-b border-gray-700 p-4">
          <h1 class="text-xl font-semibold text-white">Chat</h1>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4 mb-16" id="message-container">
          ${this.messages.map(
            (message) => html`
              <message-item
                .message=${message}
                .isUser=${message.isOwner}
              ></message-item>
            `
          )}
        </div>

        <div class="absolute bottom-0 left-0 w-full p-4 bg-gray-800/30 backdrop-blur-md border-t border-gray-700/50">
          <form @submit=${this.handleSubmit} class="flex space-x-2">
            <input
              type="text"
              .value=${this.inputValue}
              @input=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.inputValue = target.value;
              }}
              placeholder="Escribe un mensaje..."
              class="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    `;
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.inputValue.trim()) return;

    const userName = await OBR.player.getName();
    const isGM = await OBR.player.getRole() === 'GM';
    const avatar = await this.getUserAvatar(userName);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: this.inputValue,
      senderRole: isGM ? 'GM' : 'USER',
      sender: userName,
      avatar: avatar,
      timestamp: new Date(),
      isOwner: true,
    };

    userMessage.text = DOMPurify.sanitize(userMessage.text);

    this.messages = [...this.messages, userMessage];
    this.inputValue = '';

    const broadcastMessage = {...userMessage, isOwner: false}

    OBR.broadcast.sendMessage('cthulhu.message', broadcastMessage);
  } 

  async getUserAvatar(name: string): Promise<string> {
    if(!this.cacheAvatar) this.cacheAvatar = generateAvatar(name);
    return this.cacheAvatar;
  }
}
