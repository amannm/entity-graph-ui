const E = React.createElement;


class EditorContainer extends React.Component {
    render() {
        const entityTypeMap = EntityManager.getTypes();
        const items = Object.keys(entityTypeMap).map(entityTypeId => E(WorkspaceEditor, {
            key: entityTypeId,
            entityType: entityTypeMap[entityTypeId]
        }));
        return E("div", null, E("div", {className: "EditorContainer"}, items));
    }
}

class QueryContainer extends React.Component {
    constructor(props) {
        super(props);
        this.handleQuerySubmit = this.handleQuerySubmit.bind(this);
    }

    handleQuerySubmit(queryString) {

    }

    render() {
        return E("div", {className: "QueryContainer"},
            E(QueryResults, {className: "QueryResults"}),
            E(QueryEditor, {className: "QueryEditor"})
        );
    }
}
class QueryEditor extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return E("textarea", {onChange: (event) => this.props.handleQuerySubmit(event.target.value)});
    }
}
class QueryResults extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return E("div", {className: "QueryContainer"},
            E(QueryResults, {className: "QueryResults"}),
            E(QueryEditor, {className: "QueryEditor"})
        );
    }
}
class WorkspaceEditor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedEntityId: null,
            entities: [],
            lockedEntityIds: new Set()
        };
        EntityManager.getAll(props.entityType, (rawEntities) => {
            const entities = EntityManager.dedupe(rawEntities, props.entityType.idProperty);
            const selectedEntityId = entities.length > 0 ? entities[0][props.entityType.idProperty] : null;
            this.setState({
                selectedEntityId: selectedEntityId,
                entities: entities
            }, null);
        });
        this.handleEntityCreate = this.handleEntityCreate.bind(this);
        this.handleEntityDelete = this.handleEntityDelete.bind(this);
        this.handleEntityUpdate = this.handleEntityUpdate.bind(this);
        this.handleEntitySelect = this.handleEntitySelect.bind(this);
    }

    handleEntityCreate() {
            const entityType = this.props.entityType;

            const newId = EntityManager.generateId();
            const newEntity = {};
            newEntity[entityType.idProperty] = newId;
            Object.keys(entityType.properties).forEach(property => {
                const datatype = entityType.properties[property];
                switch (datatype) {
                    case "text":
                    case "string":
                        if (entityType.summaryProperties.includes(property)) {
                            newEntity[property] = "Unknown " + property;
                        } else {
                            newEntity[property] = 'unknown';
                        }
                        break;
                    case "uri":
                        newEntity[property] = 'unknown';
                        break;
                    case "integer":
                        newEntity[property] = 0;
                        break;
                    case "timestamp":
                        newEntity[property] = (new Date()).toISOString();
                        break;
                    default:
                        throw 'unknown datatype: ' + datatype;
                }
            });

            EntityManager.put(entityType, newEntity, ()=>{
                let indexToInsertAt = this.state.entities.length;
                if(this.state.selectedEntityId !== null) {
                    indexToInsertAt = this.state.entities.findIndex(entity => this.state.selectedEntityId === entity[entityType.idProperty])
                    if(indexToInsertAt < this.state.entities.length) {
                        indexToInsertAt++;
                    }
                }
                const newEntities = this.state.entities.filter(() => true);
                newEntities.splice(indexToInsertAt, 0, newEntity);
                this.setState({
                    selectedEntityId: newId,
                    entities: newEntities
                }, null);
            });

    }

    handleEntityDelete() {
        if (this.state.selectedEntityId !== null) {
            if(this.state.lockedEntityIds.has(this.state.selectedEntityId)) {
                return;
            }
            this.setState({
                lockedEntityIds: (new Set(this.state.lockedEntityIds)).add(this.state.selectedEntityId)
            }, null);
            const entityType = this.props.entityType;
            EntityManager.delete(entityType, this.state.selectedEntityId, () => {
                let indexToSelect = null;
                const newEntities = [];
                for(let i = 0; i < this.state.entities.length; i++) {
                    const entity = this.state.entities[i];
                    if(entity[entityType.idProperty] !== this.state.selectedEntityId) {
                        newEntities.push(entity);
                    } else {
                        if(this.state.entities.length !== 1) {
                            if(i === 0) {
                                indexToSelect = i;
                            } else {
                                indexToSelect = i - 1;
                            }
                        }
                    }
                }
                let nextEntityId = null;
                if(indexToSelect !== null) {
                    nextEntityId = newEntities[indexToSelect][entityType.idProperty];
                }
                const newLockedEntityIds = new Set(this.state.lockedEntityIds);
                newLockedEntityIds.delete(this.state.selectedEntityId);
                this.setState({
                    selectedEntityId: nextEntityId,
                    entities: newEntities,
                    lockedEntityIds: newLockedEntityIds
                }, null);
            });
        }
    }

    handleEntityUpdate(newEntity) {
        const entityType = this.props.entityType;
        const entityId = newEntity[entityType.idProperty];

        if (this.state.selectedEntityId !== null) {
            if(this.state.lockedEntityIds.has(entityId)) {
                return;
            }

            this.setState({
                lockedEntityIds: (new Set(this.state.lockedEntityIds)).add(entityId)
            }, null);

            EntityManager.put(entityType, newEntity, () => {
                const newEntities = this.state.entities.map(existingEntity => {
                    if (existingEntity[entityType.idProperty] === entityId) {
                        return newEntity;
                    } else {
                        return existingEntity;
                    }
                });
                const newLockedEntityIds = new Set(this.state.lockedEntityIds);
                newLockedEntityIds.delete(this.state.selectedEntityId);
                this.setState({
                    entities: newEntities,
                    lockedEntityIds: newLockedEntityIds
                }, null);
            });
        }
    }

    handleEntitySelect(entityId) {
        if (entityId !== this.state.selectedEntityId) {
            this.setState({
                selectedEntityId: entityId
            }, null);
        }
    }

    render() {

        const entityListControls = E("div", {className: "EntityListControls"},
            E("p", null, this.props.entityType.displayName),
            E("button", {type: "button", onClick: this.handleEntityCreate}, "Create"),
            E("button", {type: "button", onClick: this.handleEntityDelete}, "Delete")
        );

        const entityList = E(EntityList, {
            entityType: this.props.entityType,
            selectedEntityId: this.state.selectedEntityId,
            entities: this.state.entities,
            lockedEntityIds: this.state.lockedEntityIds,
            handleEntitySelect: this.handleEntitySelect
        });

        const entityEditor = E(EntityEditor, {
            entityType: this.props.entityType,
            selectedEntityId: this.state.selectedEntityId,
            entities: this.state.entities,
            lockedEntityIds: this.state.lockedEntityIds,
            handleEntityUpdate: this.handleEntityUpdate
        });

        return E("div", {className: "WorkspaceEditor"},
            entityEditor,
            entityList,
            entityListControls
        )
    }
}

class EntityList extends React.Component {
    render() {
        let items = null;
        if (this.props.entityType !== null) {
            const entityType = this.props.entityType;
            const idProperty = entityType.idProperty;
            const itemMapper = (entity) => {
                const entityId = entity[idProperty];
                const classNames = [];
                if(entityId === this.props.selectedEntityId) {
                    classNames.push("selected");
                }
                if(this.props.lockedEntityIds.has(entityId)) {
                    classNames.push("locked");
                }
                const clickHandler = (event) => {
                    this.props.handleEntitySelect(entityId)
                };
                return {
                    key: entityId,
                    className: classNames.join(" "),
                    onClick: clickHandler
                };
            };
            const childrenMapper = (entity) => {
                const summaryMapper = (summaryProperty) => entity[summaryProperty];
                return entityType.summaryProperties.map(summaryProperty => E("p", {key: summaryProperty}, summaryMapper(summaryProperty)));
            };
            items = this.props.entities.map(entity => E("li", itemMapper(entity), childrenMapper(entity)));
        }
        return E("ul", {className: "EntityList"}, items);
    }
}

class EntityEditor extends React.Component {
    render() {
        if(this.props.selectedEntityId) {
            const currentEntity = this.props.entities.find(entity => entity[this.props.entityType.idProperty] === this.props.selectedEntityId);
            return E(EntityProperties, {
                entityType: this.props.entityType,
                entity: currentEntity,
                isLocked: this.props.lockedEntityIds.has(currentEntity[this.props.entityType.idProperty]),
                handleEntityUpdate: this.props.handleEntityUpdate
            });
        }
        return null;
    }
}

class EntityProperties extends React.Component {

    constructor(props) {
        super(props);
        this.handlePropertyChange = this.handlePropertyChange.bind(this);
    }

    handlePropertyChange(property, value) {
        const newEntity = Object.assign({}, this.props.entity);
        newEntity[property] = value;
        this.props.handleEntityUpdate(newEntity);
    }

    render() {

        var entityType = this.props.entityType;
        var inputMapper = (property) => {
            const handler = (event) => {
                this.handlePropertyChange(property, event.target.value);
            };
            const datatype = entityType.properties[property];
            const currentValue = this.props.entity[property];
            switch (datatype) {
                case "text":
                    return E("textarea", {disabled: this.props.isLocked, value: currentValue, onChange: handler});
                case "string":
                case "uri":
                    return E("input", {type: "text", disabled: this.props.isLocked, value: currentValue, onChange: handler});
                case "integer":
                    return E("input", {type: "number", disabled: this.props.isLocked, value: currentValue, onChange: handler});
                case "timestamp":
                    return E("input", {key: property, type: "text", disabled: this.props.isLocked, value: currentValue, onChange: handler});
                default:
                    throw 'unknown datatype: ' + datatype;
            }
        };
        var inputs = Object.keys(entityType.properties).map(property => {
            return E("div", {key: property}, inputMapper(property), E("p", null, property));
        });
        inputs.unshift(E('p', {key: entityType.idProperty}, this.props.entity[entityType.idProperty]));
        return E('div', {className: "EntityProperties"}, inputs);
    }

}
