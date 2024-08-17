import { Injectable } from "@nestjs/common";
import { Service } from "typedi";
import { Entity, PrimaryGeneratedColumn, Column, EntityRepository, Repository } from "typeorm";

@Injectable()
export class UrlRequestDumpRepository {
    
    // async saveUrlRequestDump(jsonObjct:any) {
    //     try {

    //       let jsonString = JSON.stringify(jsonObjct)

    //         let urlRequest = {
    //             jsonDump: jsonString,
    //             addedDate: new Date(),
    //         } as UrlRequestDump;

    //         return  await this.save(urlRequest);
        
    //       } catch (error) {
    //         return "Failed to create new account :"+ error
    //       }
    // }
}