import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

@Entity("urlStats")
export class UrlStats {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "int"})
  urlID: number;

  @Column({ type: "datetime", nullable: true })
  lastRequested?: Date;

  @Column({ type: "int", nullable: true })
  totalRequested?: number;

  @Column({ type: "int", nullable: true })
  totalUniqueRequested?: number;
}