# 🎸 Hướng Dẫn Render Guitar Tablature từ JSON

## 📋 Tổng Quan

File JSON output từ API chứa đầy đủ thông tin để render guitar tablature chính xác như ảnh input.

---

## 🎯 Cấu Trúc JSON

```json
{
  "image_size": {
    "width": 780,
    "height": 858
  },
  "total_notes": 99,
  "total_beats": 34,
  "total_measures": 1,
  "barlines": [],
  "string_lines_detected": 6,
  "beats": [
    {
      "beat_idx": 1,
      "measure_idx": 0,
      "x_center": 0.0667,
      "notes": [
        {
          "string": "e",
          "fret": 2,
          "midi": 66,
          "hz": 369.99,
          "note_name": "F#4",
          "confidence": 0.958
        },
        {
          "string": "D",
          "fret": 0,
          "midi": 50,
          "hz": 146.83,
          "note_name": "D3",
          "confidence": 0.879
        }
      ]
    }
  ]
}
```

---

## 🎨 Cách Render Tablature

### 1. **Vẽ 6 Dây Guitar (String Lines)**

```javascript
const strings = ["e", "B", "G", "D", "A", "E"]; // Từ trên xuống dưới
const stringSpacing = 40; // Khoảng cách giữa các dây (pixels)
const startY = 100; // Vị trí Y của dây đầu tiên

// Vẽ 6 đường ngang
strings.forEach((string, index) => {
  const y = startY + index * stringSpacing;
  drawLine(0, y, canvasWidth, y, "black", 1);
  
  // Label tên dây bên trái
  drawText(string, 10, y, "12px Arial");
});
```

### 2. **Vẽ Barlines (Thanh Dọc Ngăn Cách Measures)**

```javascript
const barlines = jsonData.barlines; // Array of normalized X positions [0-1]
const canvasWidth = 1000; // Chiều rộng canvas

barlines.forEach(xNorm => {
  const x = xNorm * canvasWidth;
  drawLine(x, startY, x, startY + 5 * stringSpacing, "red", 2);
});
```

### 3. **Vẽ Notes (Số Fret trên Dây)**

```javascript
const beats = jsonData.beats;
const canvasWidth = 1000;

beats.forEach(beat => {
  // X position của beat (normalized 0-1)
  const x = beat.x_center * canvasWidth;
  
  beat.notes.forEach(note => {
    // Y position dựa trên string
    const stringIndex = strings.indexOf(note.string);
    const y = startY + stringIndex * stringSpacing;
    
    // Vẽ số fret
    drawText(
      note.fret.toString(),
      x,
      y,
      "14px Arial",
      "center", // Text alignment
      "middle"  // Vertical alignment
    );
    
    // Optional: Vẽ circle background
    drawCircle(x, y, 12, "white", "black", 1);
    drawText(note.fret.toString(), x, y, "14px Arial");
  });
});
```

---

## 📐 Tính Toán Vị Trí Chính Xác

### **X Position (Horizontal)**

```javascript
// x_center là normalized [0-1]
const xPixel = beat.x_center * canvasWidth;

// Ví dụ:
// x_center = 0.0667 → xPixel = 0.0667 * 1000 = 66.7px
// x_center = 0.5    → xPixel = 0.5 * 1000 = 500px
```

### **Y Position (Vertical)**

```javascript
const stringOrder = ["e", "B", "G", "D", "A", "E"]; // Top to bottom
const stringIndex = stringOrder.indexOf(note.string);
const yPixel = startY + stringIndex * stringSpacing;

// Ví dụ:
// string = "e" → index = 0 → y = 100 + 0*40 = 100px (dây trên cùng)
// string = "E" → index = 5 → y = 100 + 5*40 = 300px (dây dưới cùng)
```

---

## 🖼️ HTML Canvas Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Guitar Tab Renderer</title>
</head>
<body>
  <canvas id="tabCanvas" width="1000" height="400"></canvas>
  
  <script>
    const canvas = document.getElementById('tabCanvas');
    const ctx = canvas.getContext('2d');
    
    // Load JSON data
    const jsonData = /* your JSON data */;
    
    // Configuration
    const strings = ["e", "B", "G", "D", "A", "E"];
    const startY = 100;
    const stringSpacing = 40;
    const canvasWidth = canvas.width;
    
    // 1. Draw string lines
    strings.forEach((string, index) => {
      const y = startY + index * stringSpacing;
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(canvasWidth - 50, y);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw string label
      ctx.font = "12px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "right";
      ctx.fillText(string, 40, y + 4);
    });
    
    // 2. Draw barlines
    jsonData.barlines.forEach(xNorm => {
      const x = xNorm * (canvasWidth - 100) + 50;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + 5 * stringSpacing);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // 3. Draw notes
    jsonData.beats.forEach(beat => {
      const x = beat.x_center * (canvasWidth - 100) + 50;
      
      beat.notes.forEach(note => {
        const stringIndex = strings.indexOf(note.string);
        const y = startY + stringIndex * stringSpacing;
        
        // Draw circle background
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw fret number
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(note.fret.toString(), x, y);
      });
    });
  </script>
</body>
</html>
```

---

## ⚙️ React Component Example

```jsx
import React, { useRef, useEffect } from 'react';

const GuitarTabRenderer = ({ jsonData }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !jsonData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuration
    const strings = ["e", "B", "G", "D", "A", "E"];
    const startY = 100;
    const stringSpacing = 40;
    const canvasWidth = canvas.width;
    const leftMargin = 50;
    const rightMargin = 50;
    
    // Draw string lines
    strings.forEach((string, index) => {
      const y = startY + index * stringSpacing;
      
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(canvasWidth - rightMargin, y);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.font = "12px Arial";
      ctx.fillStyle = "#333";
      ctx.textAlign = "right";
      ctx.fillText(string, leftMargin - 10, y + 4);
    });
    
    // Draw barlines
    jsonData.barlines?.forEach(xNorm => {
      const x = xNorm * (canvasWidth - leftMargin - rightMargin) + leftMargin;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + 5 * stringSpacing);
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw notes
    jsonData.beats?.forEach(beat => {
      const x = beat.x_center * (canvasWidth - leftMargin - rightMargin) + leftMargin;
      
      beat.notes.forEach(note => {
        const stringIndex = strings.indexOf(note.string);
        const y = startY + stringIndex * stringSpacing;
        
        // Circle background
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Fret number
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "#2c3e50";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(note.fret.toString(), x, y);
      });
    });
    
  }, [jsonData]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={1000} 
      height={400}
      style={{ border: '1px solid #ddd' }}
    />
  );
};

export default GuitarTabRenderer;
```

---

## 🎯 Các Điểm Quan Trọng

### 1. **Thứ Tự Dây (String Order)**
```
e (dây 1) - Trên cùng
B (dây 2)
G (dây 3)
D (dây 4)
A (dây 5)
E (dây 6) - Dưới cùng
```

### 2. **Normalized Coordinates**
- `x_center`: 0.0 = bên trái, 1.0 = bên phải
- Nhân với `canvasWidth` để ra pixels
- Cộng thêm `leftMargin` nếu có

### 3. **Beat Ordering**
- Beats đã được sắp xếp theo `beat_idx` (tăng dần từ trái sang phải)
- Không cần sort lại

### 4. **Confidence Filtering**
```javascript
// Chỉ render notes có confidence cao
const filteredBeats = jsonData.beats.map(beat => ({
  ...beat,
  notes: beat.notes.filter(note => note.confidence >= 0.6)
}));
```

---

## 🔍 Kiểm Tra Độ Chính Xác

### **So Sánh với Input Image**

1. **Số lượng notes**: Đếm số notes trong ảnh vs `total_notes` trong JSON
2. **Vị trí X**: Notes ở cùng vị trí ngang phải có `x_center` gần nhau
3. **Vị trí Y**: Notes trên cùng dây phải có cùng `string`
4. **Fret numbers**: Số trên ảnh phải khớp với `fret` trong JSON

### **Debug Tips**

```javascript
// Log để kiểm tra
jsonData.beats.forEach((beat, idx) => {
  console.log(`Beat ${idx} at x=${beat.x_center}:`);
  beat.notes.forEach(note => {
    console.log(`  ${note.string}:${note.fret} (conf=${note.confidence})`);
  });
});
```

---

## 📊 Ví Dụ Thực Tế

### **Input JSON**
```json
{
  "beat_idx": 1,
  "x_center": 0.0667,
  "notes": [
    {"string": "e", "fret": 2, "confidence": 0.958},
    {"string": "D", "fret": 0, "confidence": 0.879},
    {"string": "E", "fret": 0, "confidence": 0.939}
  ]
}
```

### **Render Output**
```
Canvas width = 1000px
Left margin = 50px

X position = 0.0667 * (1000 - 50 - 50) + 50 = 110px

Notes:
- "e" (string 0): y = 100 + 0*40 = 100px → Draw "2" at (110, 100)
- "D" (string 3): y = 100 + 3*40 = 220px → Draw "0" at (110, 220)
- "E" (string 5): y = 100 + 5*40 = 300px → Draw "0" at (110, 300)
```

---

## ✅ Checklist

- [ ] Vẽ 6 dây guitar (horizontal lines)
- [ ] Vẽ barlines (vertical lines) nếu có
- [ ] Vẽ notes theo đúng vị trí X (x_center)
- [ ] Vẽ notes theo đúng vị trí Y (string)
- [ ] Hiển thị số fret chính xác
- [ ] Filter notes có confidence thấp
- [ ] So sánh với ảnh input để verify

---

## 🚀 Kết Luận

Với JSON structure này, bạn có thể render guitar tablature chính xác 100% như ảnh input bằng cách:

1. **X position**: Dùng `beat.x_center` (normalized 0-1)
2. **Y position**: Dùng `note.string` để xác định dây
3. **Content**: Hiển thị `note.fret` (số fret)
4. **Validation**: Kiểm tra `note.confidence` để filter

**Lưu ý**: Sau khi fix `dedupe_notes_in_beats()`, mỗi beat sẽ chỉ có tối đa 1 note trên mỗi dây, đảm bảo render đúng với guitar tablature constraint.
