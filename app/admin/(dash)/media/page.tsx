import { allMedia } from "@/lib/content";
import { parseLoc } from "@/lib/types";
import { deleteMedia, saveMediaTitle, uploadMedia } from "../../actions";
import { ConfirmButton, LocField, SaveButton, TextField, Uploader } from "../../ui";

export const dynamic = "force-dynamic";

function human(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaPage() {
  const media = allMedia();

  return (
    <>
      <div className="pageHead">
        <h1>媒体库</h1>
        <p>
          上传后的素材会保存在服务器的 data/uploads 目录，可在各模块的「从媒体库选择」里直接引用。
          支持 JPG / PNG / WebP / SVG / MP4，单个文件最大 64MB。
        </p>
      </div>

      <div className="card">
        <h2>上传新素材</h2>
        <p className="sub">可一次选多个文件。</p>
        <Uploader action={uploadMedia} />
      </div>

      <div className="mediaGrid">
        {media.map((m) => (
          <div className="mediaCard" key={m.id}>
            <div className="preview">
              {m.mime.startsWith("video") ? (
                <video src={m.url} muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={parseLoc(m.alt).zh} />
              )}
            </div>
            <div className="body">
              <code>{m.url}</code>
              <div className="row">
                {m.builtin === 1 ? <span className="tag">内置</span> : null}
                {m.size ? <span className="tag">{human(m.size)}</span> : null}
              </div>
              <form action={saveMediaTitle}>
                <input type="hidden" name="id" value={m.id} />
                <TextField name="title" label="备注名" value={m.title} />
                <LocField name="alt" label="替代文字（SEO / 无障碍）" value={parseLoc(m.alt)} />
                <div className="row">
                  <SaveButton />
                  {m.builtin === 1 ? null : (
                    <ConfirmButton action={deleteMedia} label="删除" />
                  )}
                </div>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
