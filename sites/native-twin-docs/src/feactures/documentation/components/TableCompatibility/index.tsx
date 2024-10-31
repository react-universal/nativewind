import { TailwindClass } from "../../../../../Interface/tailwindClass";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
export const TableCompatibility = ({ Data }: { Data: TailwindClass[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Propertied</TableHead>
          <TableHead>Native</TableHead>
          <TableHead>Web</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Data.map((item, index) => {
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.class}</TableCell>
              <TableCell>{item.native ? "Si" : "No"}</TableCell>
              <TableCell>{item.web ? "Si" : "No"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
