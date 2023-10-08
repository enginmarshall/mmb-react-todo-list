import { FC, useCallback, useEffect, useState } from "react";
import { Todo } from "./models/Todo";
import "./css/style.css";

const fetchTodosFromApi = (apiUrl: string) => {
  return fetch(`${apiUrl}/todos`).then((data) => data.json());
};

function App() {
  const defaultRefreshInterval = (1000 * 60 * 15);
  const baseUrl = "http://localhost:3001";

  const [apiUrl] = useState<string>(baseUrl);
  const [todos, setTodos] = useState<Array<Todo>>([] as Array<Todo>);
  const fetchTodos = useCallback(() => fetchTodosFromApi(apiUrl), [apiUrl]);

  const addTodo = (todo: Todo) => {
    fetch(`${apiUrl}/todos`, {
      method: "POST",
      body: JSON.stringify(todo),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((data) => data.json())
      .then((newTodo) => {
        setTodos([...todos, newTodo]);
      });
  };

  useEffect(() => {
    fetchTodos().then((data) => {
      console.log("First render...");
      setTodos(data);
    });
  }, [fetchTodos]);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Refreshing data...")
      fetchTodos().then((data) => {
        setTodos(data);
        clearInterval(interval);
      });
    }, defaultRefreshInterval);
  }, [todos, fetchTodos, defaultRefreshInterval]);

  const TodoList: FC = () => {
    const [loadingTodos, setLoadingTodos] = useState<number[]>([]);

    if (todos.length === 0) {
      return <>Loading to do list...</>;
    }

    return (
      <main className="todo-area">
        <h1>My TODO list</h1>
        <ul>
          {todos.map((item: Todo, index: number) => {
            const isDisabled = loadingTodos.includes(item.id);
            const itemId = `${item.id}todo`;

            return (
              <li key={index}>
                <input
                  id={itemId}
                  name={itemId}
                  type="checkbox"
                  checked={item.isDone}
                  disabled={isDisabled}
                  onChange={() => {
                    const newTodos = [...todos];
                    newTodos[index].isDone = !item.isDone;
                    setLoadingTodos([...loadingTodos, item.id]);
                    fetch(`${apiUrl}/todos/${item.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ isDone: newTodos[index].isDone }),
                      headers: {
                        "Content-Type": "application/json",
                      },
                    })
                      .then((data) => data.json())
                      .then(() => {
                        setTodos(newTodos);
                        setLoadingTodos(
                          [...loadingTodos].filter((x) => x === item.id)
                        );
                      });
                  }}
                />
                <label htmlFor={itemId} className={item.isDone ? "done" : ""}>{item.task}</label>
                <div className={`delete-button ${isDisabled ? 'disabled-delete-button' : 'enabled-delete-button'}`}
                  onClick={() => {
                    if (loadingTodos.includes(item.id)) {
                      return;
                    }
                    setLoadingTodos([...loadingTodos, item.id]);
                    fetch(`${apiUrl}/todos/${item.id}`, {
                      method: "DELETE",
                    })
                      .then((data) => data.json())
                      .then(() => {
                        setTodos([
                          ...todos.filter((todo: Todo) => todo.id !== item.id),
                        ]);
                        setLoadingTodos(
                          [...loadingTodos].filter((x) => x === item.id)
                        );
                      });
                  }}>Delete</div>
              </li>
            );
          })}
        </ul>
      </main>
    );
  };

  return (
    <section className="main-section">
      <h1>My TODO app</h1>
      <TodoForm onAdd={addTodo} />
      <TodoList />
    </section>
  );
}

const TodoForm: FC<{ onAdd: (todo: Todo) => void }> = ({ onAdd }) => {
  const [task, setTodo] = useState<string>("");
  return (
    <fieldset className="todo-form">
      <legend>Create Todo item</legend>
      <input
        type="text"
        value={task}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd({ id: 0, task, isDone: false });
            setTodo("");
          }
        }}

        onChange={(e) => setTodo(e.target.value)} />
      <button
        onClick={() => {
          onAdd({ id: 0, task, isDone: false });
          setTodo("");
        }}
      >
        Add task
      </button>
    </fieldset>
  );
};

export default App;
