import type { SongSectionInput } from '../../features/song/song.types';
import { DEFAULT_SECTION_TYPE_OPTIONS, type SongBaseFormValues } from './songFormFields.types';

interface SongFormFieldsProps {
  form: SongBaseFormValues;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  sectionTypeOptions?: Array<{ label: string; value: SongSectionInput['type'] }>;
}

export default function SongFormFields({
  form,
  onChange,
  sectionTypeOptions = DEFAULT_SECTION_TYPE_OPTIONS,
}: SongFormFieldsProps) {
  return (
    <>
      <div className="song-editor-grid">
        <label>
          Tieu de
          <input name="title" value={form.title} onChange={onChange} placeholder="Noi nay co anh" />
        </label>

        <label>
          Tac gia
          <input name="artist" value={form.artist} onChange={onChange} placeholder="Son Tung MTP" />
        </label>

        <label>
          Original Key
          <input name="originalKey" value={form.originalKey} onChange={onChange} placeholder="C" />
        </label>

        <label>
          Capo
          <input name="capo" type="number" min="0" max="12" value={form.capo} onChange={onChange} />
        </label>

        <label>
          Tempo
          <input name="tempo" type="number" value={form.tempo} onChange={onChange} placeholder="72" />
        </label>

        <label>
          Nhip
          <input name="timeSignature" value={form.timeSignature} onChange={onChange} placeholder="4/4" />
        </label>

        <label>
          Do kho
          <select name="difficulty" value={form.difficulty} onChange={onChange}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>

        <label>
          Section Type
          <select name="sectionType" value={form.sectionType} onChange={onChange}>
            {sectionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label>
          Section Name
          <input name="sectionName" value={form.sectionName} onChange={onChange} placeholder="Verse 1" />
        </label>

        <label>
          Genre (tach bang dau phay)
          <input name="genre" value={form.genre} onChange={onChange} placeholder="ballad, pop" />
        </label>

        <label>
          Tags (tach bang dau phay)
          <input name="tags" value={form.tags} onChange={onChange} placeholder="acoustic, cover" />
        </label>

        <label>
          Strumming Pattern
          <input name="strummingPattern" value={form.strummingPattern} onChange={onChange} placeholder="D-DU-UDU" />
        </label>

        <label>
          Youtube Link
          <input name="youtubeLink" value={form.youtubeLink} onChange={onChange} placeholder="https://youtube.com/..." />
        </label>

        <label>
          Image Link
          <input name="image" value={form.image} onChange={onChange} placeholder="https://..." />
        </label>
      </div>

      <label className="song-editor-checkbox">
        <input name="isPublic" type="checkbox" checked={form.isPublic} onChange={onChange} />
        Public bai hat
      </label>
    </>
  );
}
