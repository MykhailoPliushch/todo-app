import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API } from "./api";

const socket = io("http://localhost:3000");

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  
  useEffect(() => {
    API("/todos").then(setTodos);

    socket.on("todo_created", (todo) => setTodos((p) => [todo, ...p]));
    socket.on("todo_updated", (todo) =>
      setTodos((p) => p.map((x) => (x.id === todo.id ? todo : x)))
    );
    socket.on("todo_deleted", ({ id }) =>
      setTodos((p) => p.filter((x) => x.id !== id))
    );

    return () => {
      socket.off("todo_created");
      socket.off("todo_updated");
      socket.off("todo_deleted");
    };
  }, []);

  const addTodo = async () => {
    if (!text.trim()) return;
    await API("/todos", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    setText("");
  };

  const toggleTodo = async (todo) => {
    await API(`/todos/${todo.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...todo, done: !todo.done }),
    });
  };

  const deleteTodo = async (id) => {
    await API(`/todos/${id}`, { method: "DELETE" });
  };

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center" }}>📋 Мой список дел</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Введите задачу..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={addTodo}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "#4caf50",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              marginBottom: 8,
              borderRadius: 8,
              background: "#f9f9f9",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={!!todo.done}
                onChange={() => toggleTodo(todo)}
              />
              <span
                style={{
                  textDecoration: todo.done ? "line-through" : "none",
                }}
              >
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              style={{
                border: "none",
                background: "transparent",
                color: "red",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
