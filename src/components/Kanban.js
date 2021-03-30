import React from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import {v4 as uuid} from 'uuid';
import firebase from "../firebase";
import Task from './Task';
import '../App.css';
import Modal from './Modal'
import UpdateModal from './UpdateModal'
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";

class Kanban extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            columns: {
                [uuid()]: { name: "Candidates",items: [] },
                [uuid()]: { name: "In Progress",items: [] },
                [uuid()]: { name: "QA - Code review", items: [] },
                [uuid()]: { name: "Completed", items: [] }
                },
            isDataExist: false,
            name: "",
            modal: false,
            updateModal: false,
            board: "",
            boardId: "",
            modalInputName: "",
            taskId: ""
        }
    }

    handleChange(e) {
        const target = e.target;
        const name = target.name;
        const value = target.value;

        this.setState({[name]: value});
    }
    
    handleSubmit() {
        this.setState({ name: this.state.modalInputName });
        this.modalClose();
        this.addTask(this.state.board, this.state.boardId);
    }

    handleUpdate() {
        this.setState({ name: this.state.modalInputName });
        this.modalClose();
        this.updateTask(this.state.board, this.state.boardId, this.state.modalInputName, this.state.taskId);
    }

    modalOpen(e, columnName, columnId) {
        this.setState({ modal: true , board: columnName, boardId: columnId});
    }
    
    modalOpenUpdate(e, columnName, columnId, description, id) {
        this.setState({ updateModal: true , board: columnName, boardId: columnId, modalInputName: description, taskId: id });
    }

    modalClose(e) {
        this.setState({ modalInputName: "", modal: false, updateModal: false });
    }
    
    async onDragEnd(result, columns){
        if (!result.destination) return;
        const { source, destination } = result;
    
        if (source.droppableId !== destination.droppableId) {
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const [removed] = sourceItems.splice(source.index, 1);
            destItems.splice(destination.index, 0, removed);
            this.setState({columns:{
                ...columns,
                [source.droppableId]: {
                ...sourceColumn,
                items: sourceItems
                },
                [destination.droppableId]: {
                ...destColumn,
                items: destItems
                }
            }});
            const db = firebase.firestore();
            
            //Add a task to new destination
            await db.collection("boards").doc(destColumn.name).collection("tasks").add({
                description: removed.content,
                status: destColumn.name
            }); ;
            this.addTask(destColumn.name, destination.droppableId)
            //remove task from old source
            this.removeTask(sourceColumn.name, removed.id, source.droppableId)
        } else {
            const column = columns[source.droppableId];
            const copiedItems = [...column.items];
            const [removed] = copiedItems.splice(source.index, 1);
            copiedItems.splice(destination.index, 0, removed);
            this.setState({columns:{
                ...columns,
                [source.droppableId]: {
                ...column,
                items: copiedItems
                }
            }});
        }
    };

    componentDidMount() {
        this.prepareData();
    }

    async prepareData() {
        let itemsFromBackend = this.state.columns;
        const db = firebase.firestore();
        const boards = ["Candidates", "In Progress", "QA - Code review", "Completed"]
        for (const [index, board] of boards.entries()){
            await db.collection("boards").doc(board).collection("tasks").get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    itemsFromBackend[Object.entries(itemsFromBackend)[index][0]].items.push({id: doc.id, content: doc.data().description});
                });
            });
            if (index === boards.length - 1)
                this.setState({columns: itemsFromBackend, isDataExist: true})
        }
    }

    //Get all the tasks includes the new task
    async addTask(board, boardId){
        let itemsFromBackend= this.state.columns;
        let tasks = []
        let tasks_counter = 0;
        const db = firebase.firestore();
        await db.collection("boards").doc(board).collection("tasks").get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                tasks.push({id: doc.id, content: doc.data().description});
                tasks_counter++;
            });
        });
        //Update the tasks amount
        db.collection("boards").doc(board).update({
            "num_tasks": tasks_counter,
        });
        itemsFromBackend[boardId].items = tasks
        this.setState({columns: itemsFromBackend, isDataExist: true});
    }
    
    async updateTask(board, boardId, description, id){
        let itemsFromBackend= this.state.columns;
        let tasks = []
        const db = firebase.firestore();
        await db.collection("boards").doc(board).collection("tasks").doc(id).update({
            "description": description,
        });
        await db.collection("boards").doc(board).collection("tasks").get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                tasks.push({id: doc.id, content: doc.data().description});
            });
        });
        itemsFromBackend[boardId].items = tasks
        this.setState({columns: itemsFromBackend, isDataExist: true});
    }

    async removeTask(board, id, columnId){
        let itemsFromBackend= this.state.columns;
        let tasks = []
        let tasks_counter = 0;
        const db = firebase.firestore();

        await db.collection("boards").doc(board).collection("tasks").doc(id).delete()

        await db.collection("boards").doc(board).collection("tasks").get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                tasks.push({id: doc.id, content: doc.data().description});
                tasks_counter++;
            });
        });
        db.collection("boards").doc(board).update({
            "num_tasks": tasks_counter,
        });
        itemsFromBackend[columnId].items = tasks
        this.setState({columns: itemsFromBackend, isDataExist: true});
    }

    render(){
        let {columns, isDataExist} = this.state;
        return (
        isDataExist?
            <div style={{ display: "flex", justifyContent: "center", height: "100%" }} >
            <DragDropContext style={{background: 'white'}}
                onDragEnd={result => this.onDragEnd(result, columns)}
            >
                <Modal show={this.state.modal} handleClose={e => this.modalClose(e)}>
                    <h2>Add a new task</h2>
                    <div className="form-group">
                        <label>Enter description:</label>
                        <input type="text" value={this.state.modalInputName} name="modalInputName" onChange={e => this.handleChange(e)} className="form-control"/>
                    </div>
                    <div onClick={e => this.handleSubmit(e)}>
                    <Task description={this.state.name} status={this.state.board}></Task>
                    </div>
                </Modal>
                {Object.entries(columns).map(([columnId, column], index) => {
                return (
                    <div style={{ display: "flex",flexDirection: "column" }} key={columnId}>
                    <div className="Kanban">
                        <div style={{float: 'left'}}>{column.name}</div>
                        <div style={{float: 'right', paddingRight: '20px'}}>
                        <a href="#/" onClick={e => this.modalOpen(e, column.name, columnId)}>+</a>
                        </div>
                       
                        <Modal show={this.state.modal} handleClose={e => this.modalClose(e)}>
                            <h2>Add a new task</h2>
                            <div className="form-group">
                                <label>Enter description:</label>
                                <input type="text" value={this.state.modalInputName} name="modalInputName" onChange={e => this.handleChange(e)} className="form-control"/>
                            </div>
                            <div onClick={e => this.handleSubmit(e)}>
                            <Task description={this.state.name} status={this.state.board}></Task>
                            </div>
                        </Modal>
                    </div>
                    <div style={{ margin: 8 }}>
                        <Droppable droppableId={columnId} key={columnId}>
                        {(provided, snapshot) => {
                            return (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                style={{ background: snapshot.isDraggingOver ? "lightblue" : "lightgrey", padding: 4, width: 250, minHeight: 500 }}
                            >
                                {column.items.map((item, index) => {
                                return (
                                    <Draggable key={item.id} draggableId={item.id} index={index} >
                                    {(provided, snapshot, key) => {
                                        return (
                                            <>
                                            <button className="draggbleButton" onDoubleClick={e => this.modalOpenUpdate(e, column.name, columnId, item.content, item.id)}>
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{userSelect:"none",padding: 3,margin: "0 0 8px 0",minHeight: "50px",backgroundColor: snapshot.isDragging? "#263B4A": "#456C86",color: "white",
                                                ...provided.draggableProps.style}}
                                            >
                                            <div className="xButton" onClick={() => this.removeTask(column.name, item.id, columnId)}>X</div>
                                            <div style={{paddingBottom: '20px', textAlign: 'center'}}>
                                                {item.content}
                                            </div>
                                            </div>
                                            </button>
                                            <UpdateModal show={this.state.updateModal} handleClose={e => this.modalClose(e)}>
                                                <h2>Update a task description</h2>
                                                <div className="form-group">
                                                    <label>Enter a new description:</label>
                                                    <input type="text" value={this.state.modalInputName} name="modalInputName" onChange={e => this.handleChange(e)} className="form-control"/>
                                                </div>
                                                <div onClick={e => this.handleUpdate(e)}>
                                                <Task description={""} status={this.state.board}></Task>
                                                </div>
                                            </UpdateModal>
                                        </>
                                        );}}
                                    </Draggable>
                                );})}
                                {provided.placeholder}
                            </div>
                            );}}
                        </Droppable>
                    </div>
                    </div>
                );})}
            </DragDropContext>
            </div>: null
    )};
}

export default Kanban;