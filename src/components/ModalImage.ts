import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import OBR from '@owlbear-rodeo/sdk';

@customElement('modal-image')
export class ModalImage extends LitElement {
  @state() private imageUrl: string | null = null;
  @state() private loaded = false;

  static readonly styles = [];

  connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    const image = params.get('image');

    if (image) {
      const decoded = decodeURIComponent(image);
      const img = new Image();
      img.src = decoded;

      img.onload = () => {
        this.imageUrl = decoded;
        this.loaded = true;
      };

      img.onerror = () => {
        console.warn('No se pudo cargar la imagen:', decoded);
        this.loaded = true;
      };
    }
  }

  render() {
    return html`
      <div
        class="flex items-center justify-center w-full overflow-hidden bg-black bg-opacity-80"
        @click=${() => OBR.modal.close('ver-ficha')}
      >
        ${this.loaded && this.imageUrl
          ? html`
          <div style="width: 400px; height: 500px; background-image: url('${this.imageUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center center;">`
          : html`<p class="text-white">Loading...</p>`}
      </div>
    `;
  }
}
