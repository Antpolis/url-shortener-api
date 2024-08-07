import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Url } from "./Url.entity";
import { Audit } from "src/common/abstract/Audit";

@Entity("tag")
export class Tag extends Audit {
  @PrimaryGeneratedColumn({ type: "int", unsigned: true })
  id?: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  key?: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  value?: string;
}