# Momentum Web App Review - 2025-12-02

## 1. Technical Debt Review

### Code Quality & Structure
- **Component Structure**: The project uses a standard Next.js App Router structure. Components are grouped by feature (`tasks`, `store`, `members`), which is good.
- **Type Safety**: Interfaces are defined locally in components (e.g., `ITask` in `TaskList.tsx`).
    - *Recommendation*: Move shared interfaces to a central `types` directory or import from `momentum-shared` to ensure consistency with the backend and mobile app.
- **API Interaction**: API calls are made directly using `fetch` within components (e.g., `TaskList.tsx`).
    - *Recommendation*: Abstract API calls into a dedicated service layer (similar to `api.ts` in mobile) to handle auth headers, error handling, and base URLs consistently.
- **State Management**: State is managed locally with `useState` and `useEffect`.
    - *Recommendation*: As the app grows, consider using a global state management solution or React Query for data fetching to avoid prop drilling and redundant fetches.
- **Error Handling**: Basic error handling exists (setting `error` state), but it's repetitive across components.
    - *Recommendation*: Implement a global error boundary or a custom hook for API requests that handles errors uniformly.

### Dependencies
- **Tailwind CSS**: The project uses Tailwind v4 with a custom theme defined in `global.css`. This is modern and efficient.
- **Icons**: `lucide-react` is used, which matches the mobile app's icon set.
- **Missing Libraries**:
    - No date manipulation library (e.g., `date-fns`) is currently installed, which will be needed for the calendar.
    - No calendar library (`react-big-calendar` or `react-calendar`).

## 2. UX Review (User Experience)

### Navigation & Flow
- **Current State**: The Admin Dashboard (`/admin`) uses a simple tabbed interface (`Tasks`, `Store`, `Members`, etc.).
- **Issue**: This differs significantly from the mobile app's **Bento Command Center**, creating a disjointed experience for parents moving between devices.
- **Recommendation**: Refactor the Admin Dashboard to mirror the mobile app's widget-based layout. This provides immediate visibility into key metrics (Approvals, Bank, Routines) without needing to click through tabs.

### Feature Gaps (vs. Mobile)
- **Calendar**: The web app completely lacks the Calendar feature. Parents cannot view or manage the family schedule from the web.
- **Notifications**: There is no Notification Center. Parents won't see real-time alerts for task completions or requests.
- **Routines & Quests**: These features are missing from the web dashboard.
- **Google Auth**: The web app does not support Google Sign-In, which is now a core auth method on mobile.

### Loading & Feedback
- **Loading States**: Basic loading spinners are present.
- **Feedback**: Error messages are shown inline.
- **Recommendation**: Implement toast notifications (like on mobile) for success/error actions (e.g., "Task Approved", "Settings Saved") for better user feedback.

## 3. UI Review (User Interface)

### Aesthetics
- **Theme**: The app uses a "Calm Light" theme (`bg-gray-50`, `text-gray-900`, `indigo-600`). This is consistent with the brand but feels a bit generic compared to the mobile app's polished look.
- **Consistency**: The web app uses standard Tailwind classes.
- **Recommendation**: Ensure the color palette exactly matches the mobile app's tokens. The `global.css` defines CSS variables, which is a good start.

### Responsiveness
- **Current State**: The layout seems responsive (`max-w-7xl`, `flex-col` on mobile).
- **Issue**: The "Admin View" is restricted to desktop/tablet widths effectively.
- **Recommendation**: Ensure the new Bento Dashboard is fully responsive, stacking widgets vertically on smaller screens (mobile web).

### Specific UI Issues
- **Landing Page**: The landing page is functional but uses placeholder emojis instead of proper assets.
- **Admin Dashboard**: The tabbed interface is functional but visually flat. It lacks the "Command Center" feel of the mobile app.

## 4. Action Plan

1.  **Scaffold Bento Dashboard**: Replace the tabbed `AdminPage` with a widget-based grid layout.
2.  **Implement Calendar**: Install `react-big-calendar` and build the Calendar view.
3.  **Add Google Auth**: Integrate `@react-oauth/google`.
4.  **Refactor API**: Create a `web-api` service to centralize `fetch` calls.
5.  **Sync Types**: Update interfaces to match `momentum-shared`.
