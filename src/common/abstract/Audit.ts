import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";

export abstract class Audit {
  @Column({ type: "varchar", length: 36 })
  createdBy: string;

  @UpdateDateColumn({name: "lastModifiedDate"})
  lastModifiedDate: Date;

  @CreateDateColumn({name: "createdDate"})
  createdDate: Date;

  @DeleteDateColumn({name: "deletedDate", nullable: true})
  deletedDate?: Date;

  @Column({ type: "varchar", length: 36 })
  lastModifiedBy: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  deletedBy?: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}