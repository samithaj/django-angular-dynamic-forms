import {
    Component, ComponentFactoryResolver, ComponentRef, EventEmitter, Input, OnInit, Output, ViewChild,
    ViewContainerRef
} from '@angular/core';

import {FormGroup} from '@angular/forms';

import {DynamicFormControlModel} from '@ng-dynamic-forms/core';
import {DynamicFormService} from '@ng-dynamic-forms/core/src/service/dynamic-form.service';
import {DynamicInputModel} from '@ng-dynamic-forms/core/src/model/input/dynamic-input.model';
import {DynamicFormGroupModel} from '@ng-dynamic-forms/core/src/model/form-group/dynamic-form-group.model';
import {InternalDjangoFormComponent} from './impl/internal-django-form.component';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';

/**
 * Form component targeted on django rest framework
 */
@Component({
    selector: 'django-form-component',
    templateUrl: './django-form.component.html',
    styleUrls: ['./django-form.component.scss'],
})
export class DjangoFormComponent implements OnInit {
    private _config: any;
    private _django_url: any;
    private loading = false;
    private data: any;
    private form_name: string;

    @ViewChild('dynamicComponentContainer', {read: ViewContainerRef}) target: ViewContainerRef;
    private _internal_form: ComponentRef<InternalDjangoFormComponent>;

    @Input()
    set config(_config: any) {
        this._config = _config;
    }

    @Input()
    set django_url(_url: string) {
        this._django_url = _url;
    }

    constructor(private resolver: ComponentFactoryResolver, private http: Http) {
    }

    ngOnInit(): void {
        if (this._django_url) {
            this._download_django_form().subscribe(config => {
                this._config = config;
                this.form_name = config.name;
                this._create_form();
            });
        } else {
            this._create_form();
        }
    }

    private _download_django_form(): Observable<any> {
        this.loading = true;
        let django_form_url = this._django_url;
        if (!django_form_url.endsWith('/')) {
            django_form_url += '/';
        }
        django_form_url += 'form';
        return this.http.get(django_form_url).map(response => { this.loading = false; return response.json(); });
    }

    private _create_form() {
        this.target.clear();
        if (this._internal_form) {
            this._internal_form.destroy();
        }
        const childComponent = this.resolver.resolveComponentFactory(InternalDjangoFormComponent);
        this._internal_form = this.target.createComponent(childComponent);
        this._internal_form.instance.config = this._config;
        this._internal_form.instance.submit.subscribe(data => this.submitted(data));
        this._internal_form.instance.form_name = this.form_name;
    }

    private submitted(data) {
        if (this._django_url) {
            let call;
            switch (this._config.method) {
                case 'post':
                    call = this.http.post(this._django_url, data);
                    break;
                case 'patch':
                    call = this.http.patch(this._django_url, data);
                    break;
                default:
                    throw new Error(`Unimplemented method ${this._config.method}`);
            }
            call.subscribe(response => {
                console.log(response);
            });
        }
    }
}