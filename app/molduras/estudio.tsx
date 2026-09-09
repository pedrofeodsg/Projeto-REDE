"use client";

import {
  Camera,
  Check,
  Copy,
  Crosshair,
  Download,
  ImagePlus,
  Share2,
  TriangleAlert,
} from "lucide-react";
// Apelidado: este arquivo usa new Image() do navegador em dois lugares, e o
// componente do Next sombrearia o construtor global.
import NextImage from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { type Janela, type Moldura, montarLegenda } from "@/lib/molduras/catalogo";
import { type Analise, lerJanela } from "@/lib/molduras/janela";

/* ═══════════════════════════════════════════════════════════
   Leitura da moldura

   Onde a foto entra é medido no próprio PNG por lerJanela(), em
   lib/molduras/janela.ts. Aqui fica só a parte que precisa de navegador:
   passar a imagem por um canvas para obter os pixels.
   ═══════════════════════════════════════════════════════════ */

function analisarMoldura(img: HTMLImageElement, reserva: Janela): Analise {
  const opaca: Analise = { janela: reserva, vazada: false };

  const tela = document.createElement("canvas");
  tela.width = img.naturalWidth;
  tela.height = img.naturalHeight;
  const ctx = tela.getContext("2d", { willReadFrequently: true });
  if (!ctx) return opaca;

  ctx.drawImage(img, 0, 0);

  try {
    const { data } = ctx.getImageData(0, 0, tela.width, tela.height);
    return lerJanela(data, tela.width, tela.height, reserva);
  } catch {
    // Canvas contaminado por origem cruzada. Não deveria acontecer com um
    // arquivo de /public, mas se acontecer o catálogo resolve.
    return opaca;
  }
}

/* ═══════════════════════════════════════════════════════════
   Foto de quem está usando
   ═══════════════════════════════════════════════════════════ */

type Foto = {
  fonte: CanvasImageSource;
  largura: number;
  altura: number;
  /** Guardado para revogar quando a foto for trocada. */
  url: string | null;
};

async function lerFoto(arquivo: File): Promise<Foto> {
  // createImageBitmap resolve a rotação do EXIF sozinho — foto tirada de lado
  // no celular entra em pé. O caminho do <img> é a rede de segurança.
  try {
    const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    return { fonte: bitmap, largura: bitmap.width, altura: bitmap.height, url: null };
  } catch {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.src = url;
    await img.decode();
    return { fonte: img, largura: img.naturalWidth, altura: img.naturalHeight, url };
  }
}

function descartar(foto: Foto | null) {
  if (!foto) return;
  if (foto.url) URL.revokeObjectURL(foto.url);
  if (typeof ImageBitmap !== "undefined" && foto.fonte instanceof ImageBitmap) {
    foto.fonte.close();
  }
}

/* ═══════════════════════════════════════════════════════════ */

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/*
 * O deslocamento é guardado como fração da folga que o zoom criou, de -1 a 1,
 * e não em pixels: assim ele não precisa ser recalculado quando o zoom muda, e
 * o mesmo enquadramento vale para qualquer moldura.
 *
 * O padrão é 1 no eixo vertical, ou seja, topo da foto encostado no topo da
 * janela. Centralizar parece a escolha neutra, mas não é: em foto de pessoa o
 * rosto fica na parte de cima, e janela deitada — como a da arte redonda —
 * corta justamente a cabeça. Encostar no topo acerta o rosto na maioria das
 * fotos, e quem quiser outro corte arrasta.
 */
const ENQUADRE_PADRAO = { x: 0, y: 1 };

/*
 * Compartilhar arquivo só existe em navegador, e quase só em celular. Ler isso
 * num efeito faria o botão piscar depois da hidratação; useSyncExternalStore
 * declara o que o servidor deve supor (false) e o cliente resolve na primeira
 * renderização. Nada aqui muda com o tempo, então a inscrição é vazia.
 */
const nuncaMuda = () => () => {};
const compartilhaArquivo = () => typeof navigator !== "undefined" && "canShare" in navigator;
const noServidor = () => false;

export function Estudio({ molduras, link }: { molduras: Moldura[]; link: string }) {
  const [molduraId, setMolduraId] = useState(molduras[0]?.id ?? "");
  const moldura = useMemo(
    () => molduras.find((m) => m.id === molduraId) ?? molduras[0],
    [molduras, molduraId],
  );

  const [foto, setFoto] = useState<Foto | null>(null);
  const [zoom, setZoom] = useState(1);
  const [desloc, setDesloc] = useState(ENQUADRE_PADRAO);
  // Uma entrada por moldura já lida. Trocar de moldura e voltar não relê nada.
  const [analises, setAnalises] = useState<Record<string, Analise | "faltando">>({});
  const [ocupado, setOcupado] = useState(false);
  const [legendaId, setLegendaId] = useState(0);
  const [copiado, setCopiado] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const molduraRef = useRef(new Map<string, HTMLImageElement>());
  const arquivoRef = useRef<HTMLInputElement | null>(null);
  const fotoRef = useRef<Foto | null>(null);

  const podeCompartilhar = useSyncExternalStore(
    nuncaMuda,
    compartilhaArquivo,
    noServidor,
  );

  // O que está na tela é derivado da leitura, não copiado para outro estado:
  // um só lugar guarda a verdade e não há como os dois discordarem.
  const registro = analises[moldura.id];
  const estado =
    registro === undefined ? "carregando" : registro === "faltando" ? "faltando" : "pronta";
  const analise = registro && registro !== "faltando" ? registro : null;
  const janela = analise?.janela ?? moldura.janela;

  /* ── carregar a moldura escolhida ─────────────────────── */
  useEffect(() => {
    if (molduraRef.current.has(moldura.id)) return;

    let cancelado = false;
    const img = new Image();
    img.decoding = "async";
    img.src = moldura.arquivo;

    img
      .decode()
      .then(() => {
        if (cancelado) return;
        molduraRef.current.set(moldura.id, img);
        setAnalises((a) => ({ ...a, [moldura.id]: analisarMoldura(img, moldura.janela) }));
      })
      .catch(() => {
        if (!cancelado) setAnalises((a) => ({ ...a, [moldura.id]: "faltando" }));
      });

    return () => {
      cancelado = true;
    };
  }, [moldura]);

  useEffect(() => {
    fotoRef.current = foto;
  }, [foto]);

  // Solta o bitmap quando a tela morre. Sem isto, trocar de foto várias vezes
  // deixa cada uma delas na memória do celular.
  useEffect(() => () => descartar(fotoRef.current), []);

  /* ── geometria ────────────────────────────────────────── */

  const medidas = useMemo(() => {
    if (!foto) return null;
    // Escala base: a foto cobre a janela inteira antes de qualquer zoom, então
    // não existe posição que deixe faixa branca aparecendo.
    const cobrir = Math.max(janela.largura / foto.largura, janela.altura / foto.altura);
    const escala = cobrir * zoom;
    const largura = foto.largura * escala;
    const altura = foto.altura * escala;
    return {
      largura,
      altura,
      folgaX: Math.max(0, (largura - janela.largura) / 2),
      folgaY: Math.max(0, (altura - janela.altura) / 2),
    };
  }, [foto, janela, zoom]);

  // A fração vira pixel na hora de desenhar. Como ela já vive limitada entre
  // -1 e 1, a foto nunca chega a ser desenhada fora do lugar — e afastar o
  // zoom reenquadra sozinho, sem apagar onde a pessoa tinha posicionado.
  const deslocEfetivo = useMemo(() => {
    if (!medidas) return { x: 0, y: 0 };
    return { x: desloc.x * medidas.folgaX, y: desloc.y * medidas.folgaY };
  }, [desloc, medidas]);

  /* ── desenho ──────────────────────────────────────────── */

  const desenhar = useCallback(() => {
    const tela = canvasRef.current;
    const ctx = tela?.getContext("2d");
    if (!tela || !ctx) return;

    ctx.clearRect(0, 0, tela.width, tela.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tela.width, tela.height);

    const m = medidas;

    const porFoto = () => {
      if (!foto || !m) return;
      ctx.save();
      ctx.beginPath();
      if (analise?.vazada) {
        // Numa moldura vazada quem define o feitio é o alfa do próprio PNG —
        // e ele pode ser qualquer coisa, como o círculo com o texto e os
        // candidatos recortados por cima. Recortar a foto em elipse aqui
        // arriscaria cortá-la dentro de área que a arte deixa à mostra, então
        // o recorte é a caixa e a máscara é a arte.
        ctx.rect(janela.x, janela.y, janela.largura, janela.altura);
      } else if (janela.forma === "circulo") {
        // Elipse inscrita no retângulo da janela: é o recorte que a arte
        // redonda pede.
        ctx.ellipse(
          janela.x + janela.largura / 2,
          janela.y + janela.altura / 2,
          janela.largura / 2,
          janela.altura / 2,
          0,
          0,
          Math.PI * 2,
        );
      } else {
        // Cantos de cima arredondados como o cartão; os de baixo encostam na
        // faixa da arte e ficam retos.
        ctx.roundRect(janela.x, janela.y, janela.largura, janela.altura, [
          janela.raio,
          janela.raio,
          0,
          0,
        ]);
      }
      ctx.clip();
      ctx.drawImage(
        foto.fonte,
        janela.x + janela.largura / 2 + deslocEfetivo.x - m.largura / 2,
        janela.y + janela.altura / 2 + deslocEfetivo.y - m.altura / 2,
        m.largura,
        m.altura,
      );
      ctx.restore();
    };

    const porMoldura = () => {
      const img = molduraRef.current.get(moldura.id);
      if (img) ctx.drawImage(img, 0, 0, tela.width, tela.height);
    };

    // Moldura vazada protege a foto sozinha, então vem por cima. Moldura
    // chapada tem a área da foto pintada de branco — aí a foto é que vem por
    // cima, recortada na janela.
    if (analise?.vazada === false) {
      porMoldura();
      porFoto();
    } else {
      porFoto();
      porMoldura();
    }
  }, [analise, deslocEfetivo, foto, janela, medidas, moldura.id]);

  useEffect(() => {
    const id = requestAnimationFrame(desenhar);
    return () => cancelAnimationFrame(id);
  }, [desenhar]);

  /* ── arrastar e pinçar ────────────────────────────────── */

  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const pinca = useRef<{ distancia: number; zoom: number } | null>(null);

  // Converte pixel de tela em pixel de arte: a prévia é exibida menor que os
  // 1080 reais, e sem esta razão o arraste anda mais devagar que o dedo.
  const razao = () => {
    const tela = canvasRef.current;
    if (!tela) return 1;
    const caixa = tela.getBoundingClientRect();
    return caixa.width ? tela.width / caixa.width : 1;
  };

  function aoDescer(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!foto) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinca.current = null;
  }

  function aoMover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!foto) return;
    const anterior = ponteiros.current.get(e.pointerId);
    if (!anterior) return;
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const dedos = [...ponteiros.current.values()];

    if (dedos.length >= 2) {
      const [a, b] = dedos;
      const distancia = Math.hypot(a.x - b.x, a.y - b.y);
      if (!pinca.current) {
        pinca.current = { distancia, zoom };
      } else if (pinca.current.distancia > 0) {
        const fator = distancia / pinca.current.distancia;
        setZoom(limitar(pinca.current.zoom * fator, ZOOM_MIN, ZOOM_MAX));
      }
      return;
    }

    const k = razao();
    const m = medidas;
    if (!m) return;
    setDesloc((d) => ({
      x: m.folgaX > 0 ? limitar(d.x + ((e.clientX - anterior.x) * k) / m.folgaX, -1, 1) : d.x,
      y: m.folgaY > 0 ? limitar(d.y + ((e.clientY - anterior.y) * k) / m.folgaY, -1, 1) : d.y,
    }));
  }

  function aoSubir(e: React.PointerEvent<HTMLCanvasElement>) {
    ponteiros.current.delete(e.pointerId);
    if (ponteiros.current.size < 2) pinca.current = null;
  }

  // O wheel precisa ser não-passivo para poder cancelar a rolagem da página, e
  // o React não deixa marcar isso no JSX.
  useEffect(() => {
    const tela = canvasRef.current;
    if (!tela) return;
    const aoRolar = (e: WheelEvent) => {
      if (!fotoRef.current) return;
      e.preventDefault();
      setZoom((z) => limitar(z * (1 - e.deltaY * 0.0015), ZOOM_MIN, ZOOM_MAX));
    };
    tela.addEventListener("wheel", aoRolar, { passive: false });
    return () => tela.removeEventListener("wheel", aoRolar);
  }, []);

  /* ── ações ────────────────────────────────────────────── */

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite reescolher o mesmo arquivo
    if (!arquivo) return;

    setOcupado(true);
    try {
      const nova = await lerFoto(arquivo);
      descartar(fotoRef.current);
      setFoto(nova);
      setZoom(1);
      setDesloc(ENQUADRE_PADRAO);
    } catch {
      alert("Não consegui abrir essa imagem. Tenta outra foto.");
    } finally {
      setOcupado(false);
    }
  }

  function gerarArquivo(): Promise<File | null> {
    return new Promise((resolve) => {
      const tela = canvasRef.current;
      if (!tela) return resolve(null);
      tela.toBlob((blob) => {
        resolve(blob ? new File([blob], moldura.id + ".png", { type: "image/png" }) : null);
      }, "image/png");
    });
  }

  async function baixar() {
    setOcupado(true);
    try {
      const arquivo = await gerarArquivo();
      if (!arquivo) return;
      const url = URL.createObjectURL(arquivo);
      const a = document.createElement("a");
      a.href = url;
      a.download = arquivo.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revogar na hora corta o download em alguns navegadores de celular.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setOcupado(false);
    }
  }

  async function compartilhar() {
    setOcupado(true);
    try {
      const arquivo = await gerarArquivo();
      if (!arquivo) return;
      const dados = { files: [arquivo], title: moldura.nome };
      if (navigator.canShare?.(dados)) {
        await navigator.share(dados);
      } else {
        await baixar();
      }
    } catch {
      // Cancelar o menu de compartilhar cai aqui. Não é erro.
    } finally {
      setOcupado(false);
    }
  }

  const legenda = montarLegenda(moldura.legendas[legendaId]?.texto ?? "", link);

  async function copiarLegenda() {
    try {
      await navigator.clipboard.writeText(legenda);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      alert("Não consegui copiar. Selecione o texto e copie na mão.");
    }
  }

  /* ── tela ─────────────────────────────────────────────── */

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start lg:gap-8">
      {/* ---------- prévia ---------- */}
      <div className="vidro relative overflow-hidden rounded-[26px] p-3 lg:sticky lg:top-8">
        <div className="xadrez relative overflow-hidden rounded-[18px]">
          <canvas
            ref={canvasRef}
            width={moldura.largura}
            height={moldura.altura}
            onPointerDown={aoDescer}
            onPointerMove={aoMover}
            onPointerUp={aoSubir}
            onPointerCancel={aoSubir}
            className={"block h-auto w-full " + (foto ? "palco" : "")}
            aria-label={"Prévia da moldura " + moldura.nome}
          />

          {estado === "faltando" && (
            <div className="absolute inset-0 grid place-content-center gap-2 bg-[#0d2a0e]/92 p-6 text-center">
              <TriangleAlert className="mx-auto size-7 text-marca-amarelo" aria-hidden />
              <p className="font-marca text-[17px] font-extrabold">Moldura indisponível</p>
              <p className="text-[14px] leading-snug text-white/70">
                O arquivo desta moldura ainda não foi publicado. Avise a coordenação.
              </p>
            </div>
          )}

          {!foto && estado === "pronta" && (
            <button
              type="button"
              onClick={() => arquivoRef.current?.click()}
              className="absolute inset-0 grid cursor-pointer place-content-center gap-3 bg-[#0d2a0e]/72 p-6 text-center transition-colors hover:bg-[#0d2a0e]/60"
            >
              <span className="mx-auto grid size-16 place-content-center rounded-full bg-marca-amarelo text-[#1b2a44]">
                <ImagePlus className="size-7" aria-hidden />
              </span>
              <span className="font-marca text-[19px] font-extrabold">
                Escolher a sua foto
              </span>
              <span className="mx-auto max-w-[26ch] text-[14px] leading-snug text-white/75">
                Vale foto da galeria ou tirada na hora. Nada sai do seu celular.
              </span>
            </button>
          )}
        </div>

        {foto && (
          <p className="mt-3 px-1 text-center text-[13px] font-semibold text-white/60">
            Arraste a foto para posicionar · dois dedos para aproximar
          </p>
        )}
      </div>

      {/* ---------- controles ---------- */}
      <div className="grid gap-5">
        <input
          ref={arquivoRef}
          type="file"
          accept="image/*"
          onChange={aoEscolherArquivo}
          className="sr-only"
        />

        {/* escolha da moldura */}
        <section className="vidro rounded-[22px] p-5">
          <h2 className="font-marca text-[13px] font-extrabold uppercase tracking-[0.16em] text-marca-amarelo">
            Escolha a moldura
          </h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {molduras.map((m) => {
              const ativa = m.id === moldura.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMolduraId(m.id)}
                  aria-pressed={ativa}
                  className={
                    "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors " +
                    (ativa
                      ? "border-marca-amarelo bg-marca-amarelo/15"
                      : "border-white/20 bg-white/5 hover:bg-white/12")
                  }
                >
                  {/* A própria arte em miniatura: quem escolhe vê o que vai
                      postar, em vez de ler o nome de uma coisa que não conhece.
                      O xadrez atrás revela a janela vazada da moldura. */}
                  <span
                    aria-hidden
                    className="xadrez relative size-12 shrink-0 overflow-hidden rounded-xl"
                  >
                    <NextImage src={m.arquivo} alt="" fill sizes="48px" className="object-contain" />
                  </span>
                  <span className="font-marca text-[15px] font-extrabold leading-tight">
                    {m.nome}
                  </span>
                </button>
              );
            })}
            <span className="flex items-center rounded-2xl border border-dashed border-white/25 px-3 py-2.5 text-[13px] font-semibold text-white/50">
              Novas molduras em breve
            </span>
          </div>
        </section>

        {/* foto e ajuste */}
        <section className="vidro rounded-[22px] p-5">
          <h2 className="font-marca text-[13px] font-extrabold uppercase tracking-[0.16em] text-marca-amarelo">
            Coloque a sua foto
          </h2>

          <div className="mt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              className="botao-fio"
              onClick={() => arquivoRef.current?.click()}
              disabled={estado !== "pronta"}
            >
              <Camera className="size-4" aria-hidden />
              {foto ? "Trocar foto" : "Escolher foto"}
            </button>
            <button
              type="button"
              className="botao-fio"
              onClick={() => {
                setZoom(1);
                setDesloc(ENQUADRE_PADRAO);
              }}
              disabled={!foto}
            >
              <Crosshair className="size-4" aria-hidden />
              Reenquadrar
            </button>
          </div>

          {/* No celular o zoom é o próprio gesto de pinçar na prévia, então a
              barra só existe onde não há dedo: mouse e trackpad. */}
          <div className="mt-4 hidden sm:block">
            <label
              htmlFor="zoom"
              className="flex items-center justify-between text-[13px] font-bold text-white/70"
            >
              Aproximar
              <span className="tabular-nums text-white/50">{zoom.toFixed(1)}×</span>
            </label>
            <input
              id="zoom"
              type="range"
              className="zoom mt-1"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              disabled={!foto}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>
        </section>

        {/* Salvar. No celular isto não é seção: vira a barra fixa lá embaixo,
            que aparece só depois que existe uma arte para salvar. */}
        <section className="vidro hidden rounded-[22px] p-5 sm:block">
          <h2 className="font-marca text-[13px] font-extrabold uppercase tracking-[0.16em] text-marca-amarelo">
            Salve e poste
          </h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              className="botao-sol"
              onClick={baixar}
              disabled={!foto || ocupado}
            >
              <Download className="size-5" aria-hidden />
              {ocupado ? "Gerando…" : "Baixar imagem"}
            </button>
            {podeCompartilhar && (
              <button
                type="button"
                className="botao-fio"
                onClick={compartilhar}
                disabled={!foto || ocupado}
              >
                <Share2 className="size-4" aria-hidden />
                Compartilhar
              </button>
            )}
          </div>
          <p className="mt-3 text-[13.5px] leading-snug text-white/65">
            A arte sai em {moldura.largura}×{moldura.altura}, o tamanho exato{" "}
            {moldura.destino === "story" ? "do story" : "da publicação"}. Depois de
            salvar, abra o Instagram, toque em{" "}
            <b className="text-white/85">
              {moldura.destino === "story" ? "Story" : "Publicação"}
            </b>{" "}
            e escolha a imagem na galeria.
          </p>
        </section>

        {/* legenda */}
        <section className="vidro rounded-[22px] p-5">
          <h2 className="font-marca text-[13px] font-extrabold uppercase tracking-[0.16em] text-marca-amarelo">
            Legenda pronta
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {moldura.legendas.map((l, i) => (
              <button
                key={l.rotulo}
                type="button"
                onClick={() => setLegendaId(i)}
                aria-pressed={i === legendaId}
                className={
                  "rounded-full border px-3.5 py-1.5 text-[13.5px] font-bold transition-colors " +
                  (i === legendaId
                    ? "border-marca-amarelo bg-marca-amarelo text-[#1b2a44]"
                    : "border-white/22 bg-white/5 text-white/80 hover:bg-white/14")
                }
              >
                {l.rotulo}
              </button>
            ))}
          </div>

          <p className="mt-3 whitespace-pre-line rounded-2xl bg-[#0d2a0e]/45 p-4 text-[14.5px] leading-relaxed text-white/85">
            {legenda}
          </p>

          <button type="button" className="botao-fio mt-3" onClick={copiarLegenda}>
            {copiado ? (
              <Check className="size-4 text-marca-verde" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copiado ? "Legenda copiada" : "Copiar legenda"}
          </button>
        </section>
      </div>
    </div>

    {/*
      A saída no celular.

      Uma seção de download empurraria o botão para o fim de uma página que já
      é longa, e quem acabou de enquadrar a foto está olhando para a prévia, não
      para o rodapé. Então a ação sobe até o polegar: barra fixa, que nasce
      junto com a arte e some se a foto sair.
    */}
    {foto && estado === "pronta" && (
      <div className="entra-de-baixo fixed inset-x-0 bottom-0 z-40 sm:hidden">
        <div className="barra-celular px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2.5">
          <p className="mb-2 text-center text-[12px] font-semibold text-white/55">
            {moldura.largura}×{moldura.altura} · depois é só escolher na galeria do
            Instagram
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="botao-sol flex-1"
              onClick={baixar}
              disabled={ocupado}
            >
              <Download className="size-5" aria-hidden />
              {ocupado ? "Gerando…" : "Baixar imagem"}
            </button>
            {podeCompartilhar && (
              <button
                type="button"
                className="botao-fio aspect-square px-0"
                onClick={compartilhar}
                disabled={ocupado}
                aria-label="Compartilhar"
              >
                <Share2 className="size-5" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
