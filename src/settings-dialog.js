import * as d3 from './d3'
import {Dialog} from './dialog'
import *  as _ from 'lodash'
import {i18n} from "./i18n/i18n";
import {Templates} from "./templates";
import {Utils} from "./utils";

export class SettingsDialog extends Dialog{

    formGroups=[];

    static fontWeightOptions = ['normal', 'bold', 'lighter', 'bolder'];
    static fontStyleOptions = ['normal', 'italic', 'oblique'];

    constructor(app){
        super(app.container.select('#sd-settings-dialog'), app);

        var group = new FormGroup('general', ()=> {
            app.treeDesigner.updateCustomStyles();
            app.updateNumberFormats();
        });
        group
            .addField('fontFamily', 'text', app.treeDesigner, 'config.fontFamily')
            .addField('fontSize', 'text', app.treeDesigner, 'config.fontSize')
            .addSelectField('fontWeight', app.treeDesigner, 'config.fontWeight', SettingsDialog.fontWeightOptions)
            .addSelectField('fontStyle', app.treeDesigner, 'config.fontStyle', SettingsDialog.fontStyleOptions)
            .addField('numberFormatLocale', 'text', app, 'config.format.locales', {validate: (v)=>{try{new Intl.NumberFormat(v); return true;}catch (e){return false}}});
        this.formGroups.push(group);


        var payoffGroup = new FormGroup('payoff', ()=>app.updatePayoffNumberFormat());
        payoffGroup
            .addSelectField('style', app, 'config.format.payoff.style', ['currency', 'decimal'])
            .addSelectField('currencyDisplay', app, 'config.format.payoff.currencyDisplay', ['symbol', 'code', 'name'])
            .addField('currency', 'text', app, 'config.format.payoff.currency', {validate: (v)=>{try{new Intl.NumberFormat([], {currency:v}); return true;}catch (e){return false}}})
            .addField('minimumFractionDigits', 'number', app, 'config.format.payoff.minimumFractionDigits' , {validate: (v)=>{try{new Intl.NumberFormat([], {minimumFractionDigits:v, maximumFractionDigits:app.config.format.payoff.maximumFractionDigits}); return true;}catch (e){return false}}})
            .addField('maximumFractionDigits', 'number', app, 'config.format.payoff.maximumFractionDigits', {validate: (v)=>{try{new Intl.NumberFormat([], {minimumFractionDigits:app.config.format.payoff.minimumFractionDigits, maximumFractionDigits:v}); return true;}catch (e){return false}}})
            .addField('useGrouping', 'checkbox', app, 'config.format.payoff.useGrouping')

        this.formGroups.push(payoffGroup);

        group = new FormGroup('probability', ()=>{
            app.updateProbabilityNumberFormat();
            app.treeDesigner.updateCustomStyles().redraw();
        });
        group
            .addSelectField('style', app, 'config.format.probability.style', ['decimal', 'percent'])
            .addField('minimumFractionDigits', 'number', app, 'config.format.probability.minimumFractionDigits', {validate: (v)=>{try{new Intl.NumberFormat([], {minimumFractionDigits:v, maximumFractionDigits:app.config.format.probability.maximumFractionDigits}); return true;}catch (e){return false}}})
            .addField('maximumFractionDigits', 'number', app, 'config.format.probability.maximumFractionDigits', {validate: (v)=>{try{new Intl.NumberFormat([], {minimumFractionDigits:app.config.format.probability.minimumFractionDigits, maximumFractionDigits:v}); return true;}catch (e){return false}}})
            .addField('fontSize', 'text', app.treeDesigner, 'config.probability.fontSize')
            .addField('color', 'color', app.treeDesigner, 'config.probability.color');
        this.formGroups.push(group);


        var nodeGroup = new FormGroup('node', ()=>app.treeDesigner.updateCustomStyles().redraw());
        nodeGroup
            .addField('strokeWidth', 'text', app.treeDesigner, 'config.node.strokeWidth');

        nodeGroup.addGroup('optimal')
            .addField('strokeWidth', 'text', app.treeDesigner, 'config.node.optimal.strokeWidth')
            .addField('stroke', 'color', app.treeDesigner, 'config.node.optimal.stroke');

        nodeGroup.addGroup('label')
            .addField('fontSize', 'text', app.treeDesigner, 'config.node.label.fontSize')
            .addField('color', 'color', app.treeDesigner, 'config.node.label.color');

        nodeGroup.addGroup('payoff')
            .addField('fontSize', 'text', app.treeDesigner, 'config.node.payoff.fontSize')
            .addField('color', 'color', app.treeDesigner, 'config.node.payoff.color')
            .addField('negativeColor', 'color', app.treeDesigner, 'config.node.payoff.negativeColor');

        this.formGroups.push(nodeGroup);

        nodeGroup.addGroup('decision')
            .addField('fill', 'color', app.treeDesigner, 'config.node.decision.fill')
            .addField('stroke', 'color', app.treeDesigner, 'config.node.decision.stroke')
            .addField('selected.fill', 'color', app.treeDesigner, 'config.node.decision.selected.fill');


        nodeGroup.addGroup('chance')
            .addField('fill', 'color', app.treeDesigner, 'config.node.chance.fill')
            .addField('stroke', 'color', app.treeDesigner, 'config.node.chance.stroke')
            .addField('selected.fill', 'color', app.treeDesigner, 'config.node.chance.selected.fill');

        nodeGroup.addGroup('terminal')
            .addField('fill', 'color', app.treeDesigner, 'config.node.terminal.fill')
            .addField('stroke', 'color', app.treeDesigner, 'config.node.terminal.stroke')
            .addField('selected.fill', 'color', app.treeDesigner, 'config.node.terminal.selected.fill')
            .addGroup('payoff')
                .addField('fontSize', 'text', app.treeDesigner, 'config.node.terminal.payoff.fontSize')
                .addField('color', 'color', app.treeDesigner, 'config.node.terminal.payoff.color')
                .addField('negativeColor', 'color', app.treeDesigner, 'config.node.terminal.payoff.negativeColor');



        var edgeGroup = new FormGroup('edge', ()=>app.treeDesigner.updateCustomStyles().redraw())
            .addField('stroke', 'color', app.treeDesigner, 'config.edge.stroke')
            .addField('strokeWidth', 'text', app.treeDesigner, 'config.edge.strokeWidth');

        edgeGroup.addGroup('optimal')
            .addField('strokeWidth', 'text', app.treeDesigner, 'config.edge.optimal.strokeWidth')
            .addField('stroke', 'color', app.treeDesigner, 'config.edge.optimal.stroke');

        edgeGroup.addGroup('selected')
            .addField('strokeWidth', 'text', app.treeDesigner, 'config.edge.selected.strokeWidth')
            .addField('stroke', 'color', app.treeDesigner, 'config.edge.selected.stroke');

        edgeGroup.addGroup('label')
            .addField('fontSize', 'text', app.treeDesigner, 'config.edge.label.fontSize')
            .addField('color', 'color', app.treeDesigner, 'config.edge.label.color');

        edgeGroup.addGroup('payoff')
            .addField('fontSize', 'text', app.treeDesigner, 'config.edge.payoff.fontSize')
            .addField('color', 'color', app.treeDesigner, 'config.edge.payoff.color')
            .addField('negativeColor', 'color', app.treeDesigner, 'config.edge.payoff.negativeColor');
        this.formGroups.push(edgeGroup);


        var titleGroup = new FormGroup('diagramTitle', ()=>app.treeDesigner.updateCustomStyles().redraw());
        titleGroup
            .addField('fontSize', 'text', app.treeDesigner, 'config.title.fontSize')
            .addSelectField('fontWeight', app.treeDesigner, 'config.title.fontWeight', SettingsDialog.fontWeightOptions)
            .addSelectField('fontStyle', app.treeDesigner, 'config.title.fontStyle', SettingsDialog.fontStyleOptions)
            .addField('color', 'color', app.treeDesigner, 'config.title.color')

        .addGroup('margin')
            .addField('top', 'number', app.treeDesigner, 'config.title.margin.top')
            .addField('bottom', 'number', app.treeDesigner, 'config.title.margin.bottom');

        titleGroup
            .addGroup('description')
            .addField('show', 'checkbox', app.treeDesigner, 'config.description.show')
            .addField('fontSize', 'text', app.treeDesigner, 'config.description.fontSize')
            .addSelectField('fontWeight', app.treeDesigner, 'config.description.fontWeight', SettingsDialog.fontWeightOptions)
            .addSelectField('fontStyle', app.treeDesigner, 'config.description.fontStyle', SettingsDialog.fontStyleOptions)
            .addField('color', 'color', app.treeDesigner, 'config.description.color')
            .addField('marginTop', 'number', app.treeDesigner, 'config.description.margin.top');

        this.formGroups.push(titleGroup);

        var otherGroup = new FormGroup('other', ()=>app.treeDesigner.redraw());
        otherGroup
            .addField('disableAnimations', 'checkbox', app.treeDesigner, 'config.disableAnimations')
            .addField('forceFullEdgeRedraw', 'checkbox', app.treeDesigner, 'config.forceFullEdgeRedraw')
            .addField('hideLabels', 'checkbox', app.treeDesigner, 'config.hideLabels')
            .addField('hidePayoffs', 'checkbox', app.treeDesigner, 'config.hidePayoffs')
            .addField('hideProbabilities', 'checkbox', app.treeDesigner, 'config.hideProbabilities')
            .addField('raw', 'checkbox', app.treeDesigner, 'config.raw');

        this.formGroups.push(otherGroup);

        this.initView();

    }

    initFormGroups(container, data){
        var self = this;
        var temp = {};
        var formGroups = container.selectAll('div.sd-form-group').filter(function(d) { return this.parentNode==container.node(); }).data(data);
        var formGroupsEnter = formGroups.enter().appendSelector('div.sd-form-group').attr('id', d=>d.id).html(d=>Templates.get('settingsDialogFormGroup', d));
        formGroupsEnter.select('.toggle-button').on('click', (d) => {
            var g = container.select('#'+d.id);
            g.classed('sd-extended', !g.classed('sd-extended'));
        });

        var formGroupsMerge = formGroupsEnter.merge(formGroups);
        var inputGroups = formGroupsMerge.select('  .sd-form-group-content > .sd-form-group-inputs').selectAll('div.input-group').data(d=>d.fields);


        var inputGroupsEnter = inputGroups.enter().appendSelector('div.input-group').html(d=>d.type=='select'? Templates.get('selectInputGroup', d):Templates.get('inputGroup', d));


        inputGroupsEnter.merge(inputGroups).select('input, select').on('change input', function(d,i){
            var value = this.value;
            if(d.type=='checkbox'){
                value = this.checked
            }
            if(d.validator && !d.validator.validate(value)){
                d3.select(this).classed('invalid', true);
                if(d3.event.type=='change'){
                    this.value = d.valueAccessor.get();
                }
                return;
            }
            d3.select(this).classed('invalid', false);

            d.valueAccessor.set(value);
            if(d.valueUpdateCallback){
                d.valueUpdateCallback();
            }
            Utils.updateInputClass(d3.select(this));


        }).each(function(d, i){
            var value = d.valueAccessor.get();
            if(d.type=='checkbox'){
                this.checked = value
            }else{
                this.value = value;
            }
            temp[i]={};
            temp[i].pristineVal = value;
            if(d.validator && !d.validator.validate(value)){
                d3.select(this).classed('invalid', true);
            }else{
                d3.select(this).classed('invalid', false);
            }
            Utils.updateInputClass(d3.select(this));

        });

        formGroupsMerge.each(function(d){
            self.initFormGroups(d3.select(this).select('.sd-form-group-content > .sd-form-group-child-groups'), d.groups);
        });
    }

    initView() {
        var temp = {};
        this.initFormGroups(this.container.select('form#sd-settings-form'), this.formGroups);

    }

    onOpen(){
        this.initView();
    }

}

export class FormGroup{
    id;
    name;
    fields=[];
    groups=[];
    valueUpdateCallback;

    constructor(name, valueUpdateCallback){
        this.id = 'sd-form-group-'+name.replace(/\./g, '-');
        this.name = name;
        this.valueUpdateCallback = valueUpdateCallback;
    }

    addSelectField(name, config, path, options) {
        this.addField(name, 'select', config, path, null, options);
        return this;
    }


    addField(name, type, config, path, validator, options){
        var fieldId = this.name+"-"+name;
        var label = i18n.t("settingsDialog."+this.name+"."+name);
        var configInputField = new ConfigInputField(fieldId,fieldId, type,label, config, path, validator, options);
        configInputField.valueUpdateCallback = this.valueUpdateCallback;
        this.fields.push(configInputField);
        return this;
    }

    addGroup(name){
        var groupName = this.name+'.'+name;
        var group = new FormGroup(groupName, this.valueUpdateCallback);
        this.groups.push(group);
        return group;
    }
}

class PathValueAccessor {
    sourceObject;
    path;
    constructor(sourceObject, path){
        this.sourceObject=sourceObject;
        this.path = path;
    }

    get(){
        return _.get(this.sourceObject, this.path);
    }

    set(v){
        return _.set(this.sourceObject, this.path, v);
    }
}

class InputField{
    name;
    type;
    validator;
    valueAccessor;

    id;
    label;
    valueUpdateCallback;

    constructor(id, name, type, label, valueAccessor, validator, options){
        this.name = name;
        this.type = type;
        this.valueAccessor = valueAccessor;
        this.validator = validator;
        this.id=id;
        this.label = label;
        this.options = options;
    }

}


class ConfigInputField extends InputField{
    constructor(id, name, type, label, sourceObject, path, validator, options){
        super(id, name, type, label, new PathValueAccessor(sourceObject, path), validator, options);
    }
}

