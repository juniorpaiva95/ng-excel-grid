export interface IColumnDef {
    headerName: string;
    field: string;
    filterable?: boolean;
    width?: number;
    readonly?: boolean;
}