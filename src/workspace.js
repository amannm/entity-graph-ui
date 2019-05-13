const E = React.createElement;


class EditorContainer extends React.Component {
    render() {
        const entityTypeMap = EntityManager.getTypes();
        const items = Object.keys(entityTypeMap).map(entityTypeId => E(WorkspaceEditor, {
            key: entityTypeId,
            entityType: entityTypeMap[entityTypeId]
        }));
        return E("div", {className: "EditorContainer"}, items)
    }
}


class WorkspaceEditor extends React.Component {

    constructor(props) {
        super(props);
        const entities = EntityManager.getAll(props.entityType.id);
        const selectedEntityId = entities.length > 0 ? entities[0][props.entityType.idProperty] : null;
        this.state = {
            selectedEntityId: selectedEntityId,
            entities: entities
        };
        this.handleEntityCreate = this.handleEntityCreate.bind(this);
        this.handleEntityDelete = this.handleEntityDelete.bind(this);
        this.handleEntityUpdate = this.handleEntityUpdate.bind(this);
        this.handleEntitySelect = this.handleEntitySelect.bind(this);
    }

    handleEntityCreate() {

            const entityType = this.props.entityType;

            const newId = EntityManager.nextId();
            const newEntity = {};
            newEntity[entityType.idProperty] = newId;
            Object.keys(entityType.properties).forEach(property => {
                const datatype = entityType.properties[property];
                switch (datatype) {
                    case "text":
                    case "string":
                        if (entityType.summaryProperties.includes(property)) {
                            newEntity[property] = "New " + property;
                        } else {
                            newEntity[property] = property + '-' + newId;
                        }
                        break;
                    case "uri":
                        newEntity[property] = property + '-' + newId;
                        break;
                    case "integer":
                        newEntity[property] = 1337;
                        break;
                    case "timestamp":
                        newEntity[property] = (new Date()).toISOString();
                        break;
                    default:
                        throw 'unknown datatype: ' + datatype;
                }
            });
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

    }

    handleEntityDelete() {
        if (this.state.selectedEntityId !== null) {
            let indexToSelect = null;
            const newEntities = [];
            const entityType = this.props.entityType;
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
            this.setState({
                selectedEntityId: nextEntityId,
                entities: newEntities
            }, null);
        }
    }

    handleEntityUpdate(newEntity) {
        if (this.state.selectedEntityId !== null) {
            const entityType = this.props.entityType;
            const entityId = newEntity[entityType.idProperty];
            const newEntities = this.state.entities.map(existingEntity => {
                if (existingEntity[entityType.idProperty] === entityId) {
                    return newEntity;
                } else {
                    return existingEntity;
                }
            });
            this.setState({
                entities: newEntities
            }, null);
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
            E("button", {type: "button", onClick: this.handleEntityCreate}, "Create"),
            E("button", {type: "button", onClick: this.handleEntityDelete}, "Delete")
        );

        const entityList = E(EntityList, {
            entityType: this.props.entityType,
            selectedEntityId: this.state.selectedEntityId,
            entities: this.state.entities,
            handleEntitySelect: this.handleEntitySelect
        });

        const entityEditor = E(EntityEditor, {
            entityType: this.props.entityType,
            selectedEntityId: this.state.selectedEntityId,
            entities: this.state.entities,
            handleEntityUpdate: this.handleEntityUpdate
        });

        return E("div", {className: "WorkspaceEditor"},
            entityListControls,
            entityList,
            entityEditor
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
                const className = entityId === this.props.selectedEntityId ? "selected" : null;
                const clickHandler = (event) => {
                    this.props.handleEntitySelect(entityId)
                };
                return {
                    key: entityId,
                    className: className,
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
        var inputs = Object.keys(entityType.properties).map(property => {
            const handler = (event) => {
                this.handlePropertyChange(property, event.target.value);
            };
            const datatype = entityType.properties[property];
            const currentValue = this.props.entity[property];
            switch (datatype) {
                case "text":
                    return E("textarea", {key: property, value: currentValue, onChange: handler});
                case "string":
                case "uri":
                    return E("input", {key: property, type: "text", value: currentValue, onChange: handler});
                case "integer":
                    return E("input", {key: property, type: "number", value: currentValue, onChange: handler});
                case "timestamp":
                    const timestampHandler = (event) => {
                        if(event.target.value) {
                            const timestamp = new Date(event.target.value).toISOString().toString();
                            console.log(timestamp);
                            this.handlePropertyChange(property, timestamp);
                        }
                    };
                    const dateTimeLocalString = new Date(currentValue).toISOString().slice(0, -1);
                    return E("input", {key: property, type: "datetime-local", value: dateTimeLocalString, onChange: timestampHandler});
                default:
                    throw 'unknown datatype: ' + datatype;
            }
        });
        return E('div', {className: "EntityProperties"}, inputs);
    }

}
