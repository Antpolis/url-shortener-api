import { Service } from "typedi";
import { Entity, PrimaryGeneratedColumn, Column, EntityRepository, Repository } from "typeorm";

@Entity("urlRequestDump")
export class UrlRequestDump {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column({ type: "datetime", nullable: true })
  addedDate?: Date;

  @Column({ type: "longtext", nullable: true })
  jsonDump?: string;

  
}

@Service()
@EntityRepository(UrlRequestDump)
export class UrlRequestDumpRepository extends Repository<UrlRequestDump> {
    
    async saveUrlRequestDump(jsonObjct:any) {
        try {

          let jsonString = JSON.stringify(jsonObjct)

            let urlRequest = {
                jsonDump: jsonString,
                addedDate: new Date(),
            } as UrlRequestDump;

            return  await this.save(urlRequest);
        
          } catch (error) {
            return "Failed to create new account :"+ error
          }
    }
}