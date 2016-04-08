export default function getWrappedInstance(name) {
  return this.refs[name].getWrappedInstance();
}
