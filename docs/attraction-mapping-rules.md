# Attraction Mapping Rules

Manual mappings are used when the latest Taipei Open API cannot be matched.

For the synchronization workflow, see [attraction-data-sync.md](./attraction-data-sync.md).

| Mapping     | Meaning                                                     | Database Action                                                                                                                                          |
| ----------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rename**  | Same attraction with a new official name.                   | Update the existing attraction.                                                                                                                          |
| **Replace** | A different attraction replaces the original attraction.    | Mark the original attraction as inactive, then insert the new attraction. Reuse the original attraction's `direction` and MRT relations when applicable. |
| **Remove**  | Attraction no longer exists in the latest API.              | Mark the attraction as inactive.                                                                                                                         |
| **Add**     | New attraction without a corresponding existing attraction. | Insert a new attraction.                                                                                                                                 |
