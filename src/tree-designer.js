import * as d3 from './d3'

import {Utils} from './utils'
import * as model from './model/index'
import {ContextMenu} from './context-menu'



export class TreeDesignerConfig {
    cssClassPrefix = "sd-";
    width = undefined;
    height = undefined;
    margin = {
        left: 25,
        right: 25,
        top: 25,
        bottom: 25
    };
    symbolSize= 40;
    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class TreeDesigner {

    config;
    container;
    data; //data model manager
    svg;

    constructor(container, dataModel, config){
        this.setConfig(config);
        this.data = dataModel;
        this.initContainer(container);
        this.init();
    }

    setConfig(config) {
        if (!config) {
            this.config = new TreeDesignerConfig();
        } else {
            this.config = config;
        }
        return this;
    }

    init(){
        this.initSvg();
        this.initMainContextMenu();
        this.initBrush();
        this.initEdgeMarker();
        this.redrawEdges();
        this.initNodeContextMenu();
        this.redrawNodes();
    }
    initContainer(container) {
        this.container = container;
    }

    initSvg() {
        this.svg = this.container.selectOrAppend('svg.tree-designer');
        this.svg.attr('width', 800).attr('height', 800);

        this.mainGroup = this.svg.selectOrAppend('g.main-group');
    }

    redrawNodes() {
        var symbolSize = this.config.symbolSize;
        var symbol = d3.symbol().type(d=> d.$symbol)
            .size(d=>64);

        var nodesContainer = this.mainGroup.selectOrAppend('g.nodes');
        var nodes = nodesContainer.selectAll('.node').data(this.data.nodes, (d,i)=> d.$id);
        nodes.exit().remove();
        var nodesEnter = nodes.enter().append('g').attr('class', d=>d.type+'-node node');
        nodesEnter.append('path');
        nodesEnter.append('text');

        var nodesMerge = nodesEnter.merge(nodes);


        nodesMerge.attr('transform', d=>'translate(' + d.location.x + '  ' + d.location.y + ') rotate(-90)');
        nodesMerge.select('path')
            .attr('d', symbol)
            .each(function (d) {
                var path = d3.select(this);
                var box = path.node().getBBox();
                var error = Math.min(symbolSize / box.width, symbolSize / box.height);
                path.attr("d", symbol.size(error * error * 64));
            });



        var self = this;

        var drag = d3.drag()
            .on("start", function(d){
                self.dragStarted.call(this,d, self)
            })
            .on("drag", function (d) {
                self.drag.call(this, d, self);
            })
            .on("end", this.dragEnded);

        nodesMerge.call(drag);
        nodesMerge.on('contextmenu', this.nodeContextMenu);
    }

    dragStarted(d,self) {
        var node = d3.select(this);
        if(!node.classed("selected")){
            self.clearSelection();
        }

        node.classed("selected dragging", true);
    }

    drag(d, self){
        var dx=  d3.event.x-d.location.x;
        var dy = d3.event.y-d.location.y;

        self.mainGroup.selectAll('.node.selected, .node.dragging').each(function(d){
            d.location.x += dx;
            d.location.y += dy;
            d3.select(this).raise().attr('transform', 'translate('+d.location.x+' '+d.location.y+')  rotate(-90)');
        });
        self.redrawEdges();
    }
    dragEnded(){
        var node = d3.select(this).classed("dragging", false);
    }

    edgeLineD(edge){
        var line = d3.line()
            .x(d=> d[0])
            .y(d=> d[1])
            // .curve(d3.curveCatmullRom.alpha(0.5));


        var parentNode = edge.parentNode;
        var childNode = edge.childNode;

        var dX = childNode.location.x - parentNode.location.x;
        var dY = childNode.location.y - parentNode.location.y;

        var sign = dX>=0 ? 1 : -1;

        var slantStartXOffset = Math.min(dX/2, 30);
        var slantWidth = Math.min(20, Math.max(dX/2 - slantStartXOffset, 0));


        var point2 = [parentNode.location.x+slantStartXOffset, parentNode.location.y];
        var point3 = [parentNode.location.x+slantStartXOffset+slantWidth, childNode.location.y];
        var point4 = [childNode.location.x - (sign*(Math.max(0, Math.min(this.config.symbolSize/2+8, dX/2 - slantStartXOffset)))), childNode.location.y];
        // var point2 = [parentNode.location.x+dX/2-slantWidth/2, parentNode.location.y];
        // var point3 = [childNode.location.x-(dX/2-slantWidth/2), childNode.location.y];

        return line([[parentNode.location.x, parentNode.location.y], point2, point3, point4]);
    }


    redrawEdges() {

        var edgesContainer = this.mainGroup.selectOrAppend('g.edges');
        var edges = edgesContainer.selectAll('.edge').data(this.data.edges, (d,i)=> d.$id);
        edges.exit().remove();
        var edgesEnter = edges.enter().append('g').attr('class', 'edge');

        edgesEnter.append('path');
        var edgesMerge = edgesEnter.merge(edges);

        edgesMerge.select('path')
            .attr('d', d=> this.edgeLineD(d))
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrow)")
            .attr("shape-rendering", "optimizeQuality")
    }

    initEdgeMarker() {
        console.log(this.svg);
        var defs = this.svg.append("svg:defs");

        defs.append("marker")
            .attr("id","arrow")
            .attr("viewBox","0 -5 10 10")
            .attr("refX",5)
            .attr("refY",0)
            .attr("markerWidth",4)
            .attr("markerHeight",4)
            .attr("orient","auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("class","arrowHead");

    }

    initBrush() {
        var self = this;
        var brushContainer = this.mainGroup.append("g")
            .attr("class", "brush");

        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend);

        // brush.extent([[0, 0], [self.plot.size, self.plot.size]]);
        brushContainer.call(brush);
        
        function brushstart() {
            if (!d3.event.selection) return;
            self.clearSelection();
            ContextMenu.hide();
        }

        // Highlight the selected nodes.
        function brushmove() {
            var s = d3.event.selection;
            if(!s)return;

            self.mainGroup.selectAll(".node").classed('selected', function (d) {

                return s[0][0] <= d.location.x && d.location.x <= s[1][0]
                    && s[0][1] <= d.location.y && d.location.y <= s[1][1];
            });
        }
        // If the brush is empty, select all circles.
        function brushend() {
            if (!d3.event.selection) return;
            brush.move(brushContainer, null);

            // if (!d3.event.selection) self.mainGroup.selectAll(".selected").classed('selected', false);
        }
    }
    brushed(){
        
    }

    clearSelection(){
        this.mainGroup.selectAll(".selected").classed('selected', false);
    }

    selectNode(nodeSelection){
        this.clearSelection();

    }

    initNodeContextMenu() {
        var self = this;
        var menu = function(d){
            var deleteMenuItem = {
                title: 'Delete node',
                action: function(elm, d, i) {

                    self.removeNode(d);

                }
            };
            var menu = [];
            if(d.type=='terminal'){
                return [deleteMenuItem];
            }
            menu.push({
                title: 'Add Decision Node',
                action: function(elm, d, i) {
                    var newNode = new model.DecisionNode(new model.Point(d.location.x+120, d.location.y));
                    self.addNode(newNode,d)
                }
            });
            menu.push({
                title: 'Add Chance Node',
                action: function(elm, d, i) {
                    var newNode = new model.ChanceNode(new model.Point(d.location.x+120, d.location.y));
                    self.addNode(newNode,d)
                }
            });
            menu.push({
                title: 'Add Terminal Node',
                action: function(elm, d, i) {
                    var newNode = new model.TerminalNode(new model.Point(d.location.x+120, d.location.y));
                    self.addNode(newNode,d)
                }
            });
            menu.push(deleteMenuItem);
            return menu;
        };


        this.nodeContextMenu = new ContextMenu(menu);
    }

    initMainContextMenu() {
        var self = this;
        var menu = function(d){

            var menu = [];
            menu.push({
                title: 'Add Decision Node',
                action: function(elm, d, i) {
                    var newNode = new model.DecisionNode(new model.Point(d3.event.x, d3.event.y));
                    self.addNode(newNode)
                }
            });
            menu.push({
                title: 'Add Chance Node',
                action: function(elm, d, i) {

                    var newNode = new model.ChanceNode(new model.Point(d3.event.x, d3.event.y));
                    self.addNode(newNode)
                }
            });
            return menu;
        };


        this.mainContextMenu = new ContextMenu(menu);
        self.mainGroup.on('contextmenu',this.mainContextMenu);
    }

    addNode(node, parent){
        this.data.addNode(node, parent);
        this.redrawEdges();
        this.redrawNodes();
        return node;
    }
    
    removeNode(node) {
        this.data.removeNode(node);
        this.redrawEdges();
        this.redrawNodes();
    }
}