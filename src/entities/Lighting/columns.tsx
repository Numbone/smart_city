
import { ILightingObject } from "@/types/lighting.interface"
import { ColumnDef } from "@tanstack/react-table"

export const columns:ColumnDef<ILightingObject>[]=[
    {
        accessorKey: "id",
        header: "Id",
      },
      {
        accessorKey: "code",
        header: "Код",
      },
      {
        accessorKey: "name",
        header: "Наименование",
      },
      {
        accessorKey: "cords",
        header: "Координаты",
        cell: ({ row }) => `${row.original.coords[0]}, ${row.original.coords[1]}`,
      },
      {
        accessorKey: "Status",
        header: "Статус",
        cell: ({ row }) => `${row.original.status}`,
      },
]