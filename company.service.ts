import { Injectable, EventEmitter } from '@angular/core';
import { TrytonService } from '../ngx-tryton';
import { TrytonProvider } from '../ngx-tryton-providers/tryton-provider';
import { EncodeJSONRead } from '../ngx-tryton-json/encode-json-read';
import { Subject }    from 'rxjs/Subject';

// Models
import { Company } from './company.model';
import { environment } from '../../environments/environment';


@Injectable()
export class CompanyService {

  companyEmitter: EventEmitter<string>;
  companies: Company[];
  private companyChangedSource = new Subject<Company>();
  companyChanged$ = this.companyChangedSource.asObservable();

  constructor(public trytonProvider: TrytonProvider,
    public trytonService: TrytonService) {
    this.companies = [];
    trytonService.setServerUrl(environment.url_server);
    this.companyEmitter = new EventEmitter();
  }

  public clear() {
    while (this.companies.length) {
      this.companies.pop();
    }
  }

  public getCompanyFields() {
    return ['id', 'party.name'];
  }

  public setCompanyData(data) {
    let company = new Company();
    company.id = data['id'];
    company.name = data['party.name'];
    this.companyChangedSource.next(company);
    return company;
  }

  public getAvailableCompanies(mainCompanyId){
    let json_constructor = new EncodeJSONRead;
    let method = "company.company";
    let domain = [json_constructor.createDomain('parent', 'child_of', mainCompanyId)];
    json_constructor.addNode(method, domain, this.getCompanyFields());
    let json = json_constructor.createJson();
    this.clear();

    this.trytonProvider.rpc_call('model.res.user.getAvailableCompanies', mainCompanyId).subscribe(
      data => {
        let res = data;
        for (let x of res) {
          let company = this.setCompanyData(x);
          this.companies.push(company);
        }
        this.companyEmitter.emit('CompanyLoaded');
      },
      error => {
        console.log(error);
      }
    )

  }

  public getCompany(companyIds) {
    let json_constructor = new EncodeJSONRead;
    let method = "company.company";
    let domain = [json_constructor.createDomain('id', 'in', companyIds)];
    json_constructor.addNode(method, domain, this.getCompanyFields());
    let json = json_constructor.createJson();
    this.clear();

    this.trytonProvider.search(json).subscribe(
      data => {
        let res = data[method];
        for (let x of res) {
          let company = this.setCompanyData(x);
          this.companies.push(company);
        }
        this.companyEmitter.emit('CompanyLoaded');
      },
      error => {
        console.log(error);
      }
    )
  }
}
