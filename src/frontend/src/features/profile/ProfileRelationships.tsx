import { useNavigate } from "react-router-dom"
import { CONFIG } from "../../shared/config/AppConfig";

export function ProfileRelationships() {
    const navigate = useNavigate();
    return (
        <button id='relationship-redirection' className="text-xl text-left" onClick={() => navigate(CONFIG.USER_RELATIONSHIPS_NAVIGATION)}>
            Relationships
        </button>
    )
}
