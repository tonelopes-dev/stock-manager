# Documentação Técnica: Implementação de Vercel Blob no Next.js

Este guia fornece uma referência técnica completa para desenvolvedores que desejam implementar upload de imagens utilizando a infraestrutura do Vercel Blob.

---

## 🔐 1. Configuração de Ambiente (Segurança)

O SDK do Vercel Blob exige uma chave de autenticação para realizar operações de escrita.

### 1.1 Variáveis de Ambiente

Crie ou atualize o arquivo `.env.local`:

```env
# Obtido no dashboard da Vercel (Storage > Blob > Tokens)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

> [!IMPORTANT] > **Nunca** exponha esta chave no frontend. O upload deve ser processado via **API Routes** ou **Server Actions** para que a chave permaneça segura no servidor.

---

## 🚀 2. Instalação e Configuração Core

### 2.1 Instalar SDK

```bash
npm install @vercel/blob
```

### 2.2 Permitir Domínio de Imagens (`next.config.mjs`)

Necessário para que o componente `<Image />` do Next.js consiga processar e otimizar as imagens remotas.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};
export default nextConfig;
```

---

## ⚙️ 3. Backend: Route Handler (O Motor)

Arquivo: `app/api/upload/route.ts`

```typescript
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json(
      { error: "Nome do arquivo é obrigatório" },
      { status: 400 },
    );
  }

  try {
    // put() detecta automaticamente a BLOB_READ_WRITE_TOKEN no .env
    const blob = await put(filename, request.body!, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Vercel Blob Error:", error);
    return NextResponse.json({ error: "Falha no upload" }, { status: 500 });
  }
}
```

---

## 🎨 4. Frontend: Integração com Formulários

### 4.1 Lógica de Upload (Hooks)

```tsx
const [isUploading, setIsUploading] = useState(false);

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploading(true);
  try {
    const response = await fetch(`/api/upload?filename=${file.name}`, {
      method: "POST",
      body: file,
    });

    const blob = await response.json();
    form.setValue("imageUrl", blob.url); // Atualiza schema (Zod/React Hook Form)
  } catch (error) {
    // Tratamento de erro
  } finally {
    setIsUploading(false);
  }
};
```

### 4.2 UI de Preview (Compacto)

```tsx
<div className="flex items-center gap-4">
  {/* Campo de Nome */}
  <Input {...form.register("name")} />

  {/* Preview/Upload Container */}
  <div className="group relative h-24 w-24 overflow-hidden rounded-xl border-2 border-dashed">
    {form.watch("imageUrl") ? (
      <div className="h-full w-full">
        <img
          src={form.watch("imageUrl")}
          className="h-full w-full object-cover"
        />
        <button onClick={() => form.setValue("imageUrl", "")} className="...">
          Remover
        </button>
      </div>
    ) : (
      <label className="flex h-full cursor-pointer flex-col items-center justify-center">
        {isUploading ? <Spinner /> : <UploadIcon />}
        <input type="file" className="hidden" onChange={handleImageUpload} />
      </label>
    )}
  </div>
</div>
```

---

## 🛠️ 5. Troubleshooting & Dashboard

### 🛑 Erro: "Cannot use public access on a private store"

Este é o erro mais comum. Por padrão, algumas stores são criadas como **Private**.

**Solução:**

1. No dashboard da Vercel, vá em **Storage**.
2. Selecione a sua store do **Blob**.
3. Em **Settings**, altere o **Access Level** para **Public**.
4. Salve as alterações.

### 💡 5. Lidando com Imagens Pesadas (Otimização)

Uma das maiores preocupações em sistemas de catálogo é o upload de imagens de alta resolução (ex: fotos de 10MB tiradas do celular) que podem degradar a performance e aumentar os custos de storage.

#### 5.1 Otimização na Exibição (`next/image`)

Mesmo que o upload seja de uma imagem gigante, o Next.js resolve o problema para o usuário final:

- **Redimensionamento Automático**: O componente `<Image />` solicita ao servidor da Vercel uma versão redimensionada e comprimida (WebP/AVIF) da imagem original.
- **Lazy Loading**: A imagem só é baixada quando entra no viewport.
- **Sizes**: O uso de `sizes="(max-width: 768px) 100vw, 33vw"` garante que um celular não baixe uma imagem de 2000px se ele só precisa de 400px.

#### 5.2 Otimização no Upload (Client-side Compression)

[OPCIONAL/RECOMENDADO] Para economizar banda e storage, você pode comprimir a imagem no navegador antes de enviar para a API:

```tsx
// Exemplo conceitual usando canvas ou biblioteca (ex: browser-image-compression)
const compressImage = async (file: File) => {
  // 1. Validar tamanho máximo (ex: 5MB)
  if (file.size > 5 * 1024 * 1024) {
    // Lógica para reduzir resolução ou avisar o usuário
  }
  return file; // Retorne o arquivo otimizado
};
```

---

## 🧹 7. Estratégias de Otimização e Limpeza

Para evitar o acúmulo de arquivos órfãos e economizar espaço no tier gratuito, seguimos estas práticas:

### 7.1 Upload Atômico (Server-side)
Sempre valide os campos do formulário **antes** de realizar o upload. Caso o salvamento no banco de dados falhe após o upload, apague o arquivo imediatamente.

```typescript
// Exemplo conceitual em Server Action
try {
  const file = formData.get("file");
  const validated = schema.parse(data); // Valide PRIMEIRO

  const blob = await uploadFile(file); // Upload SEGUNDO
  
  try {
    await db.save(validated, blob.url);
  } catch (dbError) {
    await deleteFile(blob.url); // LIMPEZA se o banco falhar
    throw dbError;
  }
} catch (error) { ... }
```

### 7.2 Substituição de Arquivos
Ao atualizar uma imagem existente, certifique-se de apagar a imagem antiga do Blob Storage somente **após** a confirmação do sucesso da atualização no banco de dados.

### 7.3 Compressão no Cliente (Browser)
Reduza o tamanho da imagem antes mesmo de ela sair do dispositivo do usuário. Isso economiza banda e storage.
- **Resolução Sugerida**: Máximo de 1920px de largura.
- **Formato**: JPEG ou WebP com qualidade ~80%.

---

## 🔗 Referências Oficiais

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
