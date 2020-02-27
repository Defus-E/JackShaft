commitf() {
  if [[ -n "$COMMIT" && -n "$BRANCH" ]]
  then
    git add .
    if [ "$COMMIT" == "1" ]
    then
      read -p "Write a message to commit: " message
      git commit -m "$message"
    else
      printf "\n  (End with an empty line)\n"
      while IFS= read -r -e -p "Next file: " path; do
        [[ $path ]] || break
        message=
        while [[ $message = "" ]]; do
          read -p "Write a message for this file[Not empty]:`echo $'\n > '`" message
        done
        path=$(echo "$path" | xargs)
        git commit -m "$message" "$path"
      done
    fi
    git push origin $BRANCH
  fi
}

package="push"

while test $# -ge 0; do
  case "$1" in
    -h|--help)
      echo "$package - command to commit and push git repositories"
      echo " "
      echo "$package [options*]"
      echo " "
      echo "options:"
      echo "-h, --help                show brief help"
      echo "-c, --commit=boolean      specify a commit to use"
      echo "-b, --branch=name         specify a branch to use"
      exit 0
      ;;
    -c)
      shift
      if test $# -gt 0; then
        export COMMIT=$1
      else
        echo "No commit found"
        exit 1
      fi
      shift
      ;;
    --commit*)
      export COMMIT=`echo $1 | sed -e 's/^[^=]*=//g'`
      shift
      ;;
    -b)
      shift
      if test $# -gt 0; then
        export BRANCH=$1
      else
        echo "No branch found"
        exit 1
      fi
      shift
      ;;
    --branch*)
      export BRANCH=`echo $1 | sed -e 's/^[^=]*=//g'`
      shift
      ;;
    *)
      commitf
      break
      ;;
  esac
done