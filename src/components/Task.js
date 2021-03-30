import React from 'react';
import firebase from "../firebase";

class Task extends React.Component {
    
    updateInput = e => {
    this.setState({
        [e.target.name]: e.target.value
    });
    }   

    addUser = (e, description, status) => {
        e.preventDefault();
        const db = firebase.firestore();
        if (description !== ""){
            db.collection("boards").doc(status).collection("tasks").add({
                description: description,
                status: status
            });  
        }
    };

    render() {
        let {description, status} = this.props;
        return (
            <form onSubmit={e => this.addUser(e, description, status)}>
                <button type="submit">save</button> 
            </form>
            );
        }
    }
    
export default Task;