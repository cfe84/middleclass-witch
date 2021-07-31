Middlecass Witch helps you organize your notes within an unstructured directory. The goal is that you capture things quickly, still making it easy to recover afterwards.

It offers two main sets of features:
- File management, organizing files into an opinionated set of folders and files
- Todo management, collecting todos from project notes.

![Example of todos](/doc/img/todos.png)

It was built after [Middleclass Witch](), decoupling file management from the project management.

## Opinionated workflow

### Projects

Middleclass Witch instruments an opinionated workflow, which central aspect is that of a project. Most of your (professional) life revolves around poorly defined projects that you need to lead to completion. A project is therefore the sum of its contents (notes, documents) and actions (todos). The workflow usually begins with creating a project and adding notes to it. This could be the notes for the first meeting about a topic, or ideas around a new initiative. They can also start with an uncategorized not in the inbox, to be categorized into a project later. Once a project is completed, OR abandoned, it is archived.

PW also instruments the notion of recurrences: those meetings and cadences that happen regularly and don't really categorize as project, and which are more convenient to keep together (say, 1:1 meetings, planning sessions, monthly business reviews, etc.)

### Todos

Notes shall be taken in markdown. It is very frequent that you define todos while taking notes. When you finally admit that the distinction between notes and todos is pretty fuzzy, merging both together seems to make sense. Middleclass Witch offers a robust way to organize these, using projects as the background organization layer, adding to that statuses, a process of selection for creating a todo-list for the day, and flexible attributes.

Todos are noted with the `[ ]` symbol at the beginning of the line (or after a list marker). A completed todo is marked `[x]`. If you decide to delegate a todo, mark it `[d]`. When you are in progress, mark a `[-]`, in progress todos should be completed first. A todo is rarely done in one day, and often requires information found in various places: emails, IM, websites. When receiving new information about a todo, rather than scattering in different tools, add sub-items to keep track of what's happening. PW offers a command to add the date to the beginning of the line by pressing `alt+.`. This helps remembering what is happening. For example:

```markdown
- [d] Write monthly report @assignee(Geraldine) @due(2020-09-10)
  - 2020-08-01: Lorraine asked to fill the new features section by Sept 10
  - 2020-08-04: Asked Geraldine to do it
  - 2020-08-10: Checked with Geraldine, she needs more time
```

To select todos you want to address today, add a `@selected` attribute on their lines. This conveniently places those todos in a folder on top of the "Todos" window.

## Extension Settings

App requires the folder structure to be the following:

- Current - a set of markdown notes for projects you are still working on
- Archive - Projects that are no longer active

**Templates**: To use templates, create a folder `.mw/templates` in your root folder, and put templates there. They can embed variables using the format `${Variable name}` which will be prompted upon creation of a note from the template. To use templates, use the command `Middleclass Witch: Create Note from Template`

## Todo

Middleclass Witch also includes a todo management system. These are displayed in an explorer window called "todo hierarchy". Any markdown file with a line following this format:

```markdown
[ ] This is a todo
```

Boxes can be toggled using `alt+enter`

will be considered as a todo. In the box, the following values are use:
- `x` when completed. PW provides a shortcut: `Alt+x`
- `d` when delegated: `alt+d`
- `-` when in progress: `alt+-`
- `!` when attention is required `alt+shift+!`
- `space` when todo `alt+t`
- remove the space, when cancelled: `alt+c`

PW also supports inline attributes, using the following format: `@attributename(attribute value)`. These are used for display in the explorer window.

There are a few special attributes:
- `selected` which allows you to pick some tasks you want to keep in front (say, for example, those you want to process today, or this week).
- `project` allows you to specify another project a given Todo should be assigned to

## Todos view

PW comes with a handy view that lists all todos in the current hierarchy. This view can be customized to:
- Display "selected" todos on top of the list
- Group by any attribute

## Features

Basic

1. [x] Parse folder
2. [x] Project view
3. [x] Header autocomplete
4. [x] Quick create note
5. [ ] Handle attribute property file     
6. [x] Consolidate attributes
7. [x] Handle archive based on attributes
8. [x] Limit the folders being parsed to current
9. [x] Delete note
10. [ ] Display archive
11. [ ] Attribute files
12. [x] Quick search with title
13. [ ] Merge two notes

Handle reference

## Known Issues

None yet

## Release Notes

### 0.6.0

- Fix todo hierarchy
- Fix setting dates on todo

### 0.5.0

- Search with title and attribute using symbol search

### 0.4.0

Archive and consolidate by attribute

### 0.3.0

- Delete notes

### 0.1.0