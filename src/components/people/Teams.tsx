import { useEffect, useState } from "react";
import { createUseStyles } from "react-jss";
import { Button } from "components";
import { IPerson, ITeam, ITeamMember } from "types";
import { PersonPicker } from "components/people/PersonPicker";
import { TextInput } from "components/_basis/TextInput";
import { COLORS } from "style/variables";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const useStyles = createUseStyles({
  teams: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  newTeam: {
    display: "flex",
    gap: 10,
    borderBottom: `1px solid ${COLORS.border}`,
    paddingBottom: 20,
  },
  teamPicker: {
    marginTop: 25,
    display: "flex",
    gap: "10px",
  },
  memberTable: {
    marginTop: 15,
    width: "fit-content",
  },
  personPickerWrapper: {
    marginTop: 50,
    borderTop: `1px solid ${COLORS.border}`,
  },
});

export const LOCALSTORAGE_TEAMS_KEY = "planningcenter.teams";

export const Teams = () => {
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [activeTeam, setActiveTeam] = useState<ITeam | undefined>();
  const [newTeamName, setNewTeamName] = useState("");

  const createTeam = () => {
    setTeams([
      ...teams,
      {
        name: newTeamName,
        members: [],
        id: Math.max(1, ...teams.map((team) => team.id + 1)),
      } as ITeam,
    ]);
    setNewTeamName("");
  };

  const addTeamMember = (member: IPerson) => {
    if (!activeTeam) {
      return;
    }
    const team = {
      ...activeTeam,
      members: [
        ...activeTeam.members,
        {
          id: member.id,
          fullName: `${member.firstName} ${
            member.middleName ? `${member.middleName} ` : ""
          }${member.lastName}`,
        } as ITeamMember,
      ],
    };
    setActiveTeam(team);
    setTeams(
      [...teams.filter((t) => t.id !== team.id), team].sort(
        (a, b) => a.id - b.id
      )
    );
  };

  const removeTeamMember = (member: ITeamMember) => {
    if (!activeTeam) {
      return;
    }

    if (
      !window.confirm(
        `Er du sikker på at du vil fjerne ${member.fullName} fra ${activeTeam.name}?`
      )
    ) {
      return;
    }

    const team = {
      ...activeTeam,
      members: activeTeam?.members.filter((m) => m.id !== member.id),
    };
    setActiveTeam(team);
    setTeams(
      [...teams.filter((t) => t.id !== team.id), team].sort(
        (a, b) => a.id - b.id
      )
    );
    saveTeams();
  };

  const saveTeams = async () => {
    localStorage.setItem(LOCALSTORAGE_TEAMS_KEY, JSON.stringify(teams));
    const firestore = getFirestore();
    const docRef = await addDoc(
      collection(firestore, `personal/${getAuth().currentUser?.uid}/teams`),
      teams
    );
  };

  const loadTeams = async () => {
    const stringValue = localStorage.getItem(LOCALSTORAGE_TEAMS_KEY);
    const firestore = getFirestore();
    const docRef = await getDoc(
      doc(firestore, `personal/${getAuth().currentUser?.uid}`)
    );
    setTeams(docRef.data() as ITeam[]);
    if (stringValue) {
      setTeams(
        (JSON.parse(stringValue) as ITeam[]).sort((a, b) => a.id - b.id)
      );
    }
  };

  const removeTeam = (team: ITeam) => {
    if (
      !window.confirm(`Er du sikker på at du vil slette teamet ${team.name}?`)
    ) {
      return;
    }
    setTeams(
      [...teams.filter((t) => t.id !== team.id)].sort((a, b) => a.id - b.id)
    );
    saveTeams();
    setActiveTeam(undefined);
  };

  useEffect(() => {
    loadTeams();
  }, []);
  useEffect(() => {
    saveTeams();
  }, [teams]);

  const classes = useStyles();
  return (
    <section className={classes.teams}>
      <h3>Legg til team</h3>
      <div className={classes.newTeam}>
        <TextInput
          value={newTeamName}
          onInput={(e) => setNewTeamName(e.currentTarget.value)}
          onKeyPress={(e) => e.key === "Enter" && createTeam()}
        />
        <Button onClick={createTeam}>Legg til team</Button>
      </div>
      <div className={classes.teamPicker}>
        {teams.map((team) => (
          <Button
            type={team === activeTeam ? "primary" : "secondary"}
            key={team.id}
            onClick={() => setActiveTeam(team)}
          >
            {team.name}
          </Button>
        ))}
      </div>
      {activeTeam && (
        <>
          <table className={classes.memberTable}>
            <tbody>
              {activeTeam?.members.map((member) => (
                <tr key={member.id}>
                  <td>{member.fullName}</td>
                  <td>
                    <Button
                      onClick={() => removeTeamMember(member)}
                      type="danger"
                    >
                      <i className="las la-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <span>
            <Button onClick={() => removeTeam(activeTeam)} type="danger">
              Slett valgt team
            </Button>
          </span>
        </>
      )}
      {activeTeam && (
        <div className={classes.personPickerWrapper}>
          <h3>Legg til medlem i team</h3>
          <PersonPicker onPersonSelected={(person) => addTeamMember(person)} />
        </div>
      )}
    </section>
  );
};
