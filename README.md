# Recipe Finder

A web app built with HTML, CSS and JavaScript for CSE-2340 (MP3-MP4).
Search recipes from a free API, view ingredients and instructions, and save
favourites to your own cookbook.

**API used:** TheMealDB - https://www.themealdb.com/api.php (free, no API key)

## How to run
Open `index.html` in a browser (internet is needed for the API).

## Features
- Search recipes by dish name
- Filter by category and sort A to Z / Z to A
- Click a recipe to see ingredients, instructions and a YouTube link
- Save recipes to "My Cookbook" with the heart button
- Dark mode toggle
- Cookbook, last search and theme are remembered after refresh

## Requirement mapping
| Requirement | Where in the project |
|---|---|
| DOM manipulation and dynamic rendering | `render()`, `buildCard()`, `openDialog()` use `querySelector`, `createElement`, `appendChild`; search, filter and select recipe |
| Event handling and JS logic | `addEventListener` on form, selects, tabs, cards, theme button; `map()`, `filter()`, `find()`, `some()`, `forEach()`, `sort()` |
| API and async | `searchRecipes()` uses `fetch()` + `async/await` + `try/catch`; loading spinner, error with Retry, empty state |
| Local Storage | `localStorage` keeps cookbook, last search and theme |

## Files
- `index.html` - structure
- `styles.css` - design (light and dark theme)
- `app.js` - all logic
