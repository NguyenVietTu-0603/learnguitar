import {
    isArray,
    isBoolean,
    isIn,
    isInt,
    isNotEmpty,
    isString,
    isURL,
    max,
    min
} from 'class-validator';

const DIFFICULTY = ['beginner', 'intermediate', 'advanced'];
const CATEGORIES = ['major', 'minor', 'seventh', 'suspended', 'diminished', 'augmented', 'extended', 'other'];

export const CreateChordDto = {
    name: '',
    displayName: '',
    positions: [0, 0, 0, 0, 0, 0],
    fingers: [0, 0, 0, 0, 0, 0],
    difficulty: 'beginner',
    category: 'other',
    audioUrl: '',
    alias: [],
    notes: [],
    tags: []
};

export const UpdateChordDto = {
    name: undefined,
    displayName: undefined,
    positions: undefined,
    fingers: undefined,
    difficulty: undefined,
    category: undefined,
    audioUrl: undefined,
    alias: undefined,
    notes: undefined,
    tags: undefined
};

const ensureArrayOfInts = (value, field, errors, { length = 6, minValue = -1, maxValue = 24 } = {}) => {
    if (!isArray(value) || value.length !== length) {
        errors.push({ field, message: `${field} phai la mang ${length} phan tu` });
        return;
    }

    const hasInvalidItem = value.some((item) => !isInt(item) || !min(item, minValue) || !max(item, maxValue));
    if (hasInvalidItem) {
        errors.push({ field, message: `${field} chi duoc chua so nguyen trong khoang cho phep` });
    }
};

const validateBaseChordPayload = (payload = {}) => {
    const errors = [];

    if (!isString(payload.name) || !isNotEmpty(payload.name)) {
        errors.push({ field: 'name', message: 'name khong hop le' });
    }

    if (!isString(payload.displayName) || !isNotEmpty(payload.displayName)) {
        errors.push({ field: 'displayName', message: 'displayName khong hop le' });
    }

    ensureArrayOfInts(payload.positions, 'positions', errors, { minValue: -1, maxValue: 24 });

    if (payload.fingers !== undefined) {
        ensureArrayOfInts(payload.fingers, 'fingers', errors, { minValue: 0, maxValue: 4 });
    }

    if (payload.difficulty !== undefined && !isIn(payload.difficulty, DIFFICULTY)) {
        errors.push({ field: 'difficulty', message: 'difficulty khong hop le' });
    }

    if (payload.category !== undefined && !isIn(payload.category, CATEGORIES)) {
        errors.push({ field: 'category', message: 'category khong hop le' });
    }

    if (payload.capo !== undefined && payload.capo !== null && (!isInt(payload.capo) || !min(payload.capo, 0) || !max(payload.capo, 24))) {
        errors.push({ field: 'capo', message: 'capo phai la so nguyen trong khoang 0-24' });
    }

    if (payload.audioUrl !== undefined && payload.audioUrl !== null && payload.audioUrl !== '' && !isURL(payload.audioUrl)) {
        errors.push({ field: 'audioUrl', message: 'audioUrl khong dung dinh dang URL' });
    }

    if (payload.isBarre !== undefined && !isBoolean(payload.isBarre)) {
        errors.push({ field: 'isBarre', message: 'isBarre phai la boolean' });
    }

    if (payload.alias !== undefined && !isArray(payload.alias)) {
        errors.push({ field: 'alias', message: 'alias phai la mang chuoi' });
    }

    if (payload.notes !== undefined && !isArray(payload.notes)) {
        errors.push({ field: 'notes', message: 'notes phai la mang chuoi' });
    }

    if (payload.tags !== undefined && !isArray(payload.tags)) {
        errors.push({ field: 'tags', message: 'tags phai la mang chuoi' });
    }

    return errors;
};

export const validateCreateChordDto = (payload = {}) => {
    const errors = validateBaseChordPayload(payload);
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateUpdateChordDto = (payload = {}) => {
    const errors = validateBaseChordPayload({
        ...payload,
        name: payload.name ?? 'tmp',
        displayName: payload.displayName ?? 'tmp',
        positions: payload.positions ?? [0, 0, 0, 0, 0, 0]
    }).filter((error) => {
        const rootField = error.field.split('.')[0];
        return payload[rootField] !== undefined;
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const chordResponseDto = (chord) => ({
    id: chord.id,
    name: chord.name,
    slug: chord.slug,
    displayName: chord.displayName,
    alias: chord.alias,
    positions: chord.positions,
    fingers: chord.fingers,
    difficulty: chord.difficulty,
    capo: chord.capo,
    key: chord.key,
    notes: chord.notes,
    audioUrl: chord.audioUrl,
    diagramSvg: chord.diagramSvg,
    isBarre: chord.isBarre,
    category: chord.category,
    tags: chord.tags,
    popularity: chord.popularity,
    usageCount: chord.usageCount,
    createdAt: chord.createdAt,
    updatedAt: chord.updatedAt,
    songs: Array.from(
        new Map(
            (chord.songUsages || [])
                .map((usage) => usage.song)
                .filter(Boolean)
                .map((song) => [song.id, song])
        ).values()
    )
});

export const ChordResponseDto = chordResponseDto;

export const chordListResponseDto = (chords = []) => ({
    data: chords.map((chord) => ({
        id: chord.id,
        name: chord.name,
        slug: chord.slug,
        displayName: chord.displayName,
        difficulty: chord.difficulty,
        category: chord.category,
        popularity: chord.popularity,
        usageCount: chord.usageCount,
        audioUrl: chord.audioUrl
    }))
});