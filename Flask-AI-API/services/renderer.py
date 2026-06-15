"""
TabRenderer — render tablature từ structured JSON ra ASCII text.

Phù hợp với format JSON có:
- metadata
- notes
- staffs[].events[].string_fret_map
- events[]
"""

STRING_ORDER = ["e", "B", "G", "D", "A", "E"]
EVENT_SPACER = 2
BLANK_LINE_BETWEEN_STAFFS = True


class TabRenderer:
    def render_from_json(
        self,
        json_data: dict,
        string_order: list[str] | None = None,
        event_spacer: int = EVENT_SPACER,
        blank_line_between_staffs: bool = BLANK_LINE_BETWEEN_STAFFS,
    ) -> str:
        """Render toàn bộ structured JSON thành ASCII tab."""
        string_order = string_order or STRING_ORDER
        staffs = json_data.get("staffs", [])
        if not staffs:
            return ""

        rendered_staff_blocks = []

        for staff in staffs:
            events = staff.get("events", [])
            lines = {s: f"{s}|" for s in string_order}

            if not events:
                rendered_staff_blocks.append("\n".join(lines[s] for s in string_order))
                continue

            for event in events:
                string_fret_map = event.get("string_fret_map", {})
                tokens = {}
                max_width = 1

                for s in string_order:
                    fret = string_fret_map.get(s)
                    token = "-" if fret is None else str(fret)
                    tokens[s] = token
                    max_width = max(max_width, len(token))

                slot_width = max_width + event_spacer

                for s in string_order:
                    token = tokens[s]
                    if token == "-":
                        cell = "-" * slot_width
                    else:
                        cell = token + ("-" * (slot_width - len(token)))
                    lines[s] += cell

            rendered_staff_blocks.append("\n".join(lines[s] for s in string_order))

        joiner = "\n\n" if blank_line_between_staffs else "\n"
        return joiner.join(rendered_staff_blocks)

    def render_grid(self, json_data: dict) -> list[list[list[str]]]:
        """
        Render thành grid 3D để dùng trong web editor.

        Returns:
            [
              [  # staff 0
                ["0", "", ...],  # string e
                ["", "1", ...],  # string B
                ...
              ],
              ...
            ]
        """
        staffs = json_data.get("staffs", [])
        if not staffs:
            return []

        all_staff_grids = []
        for staff in staffs:
            events = staff.get("events", [])
            rows = [[] for _ in range(6)]

            for event in events:
                fret_map = event.get("string_fret_map", {})
                for string_id, string_name in enumerate(STRING_ORDER):
                    rows[string_id].append(fret_map.get(string_name) or "")

            all_staff_grids.append(rows)

        return all_staff_grids
